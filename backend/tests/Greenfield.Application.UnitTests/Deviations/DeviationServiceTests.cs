using FluentAssertions;
using Greenfield.Application.Abstractions;
using Greenfield.Application.Deviations;
using Greenfield.Domain.Deviations;
using Moq;
using Xunit;

namespace Greenfield.Application.UnitTests.Deviations;

/// <summary>
/// Unit tests for <see cref="DeviationService"/> covering CRUD, workflow
/// transitions, timeline management, and CSV export.
/// </summary>
public sealed class DeviationServiceTests
{
    // ── Helpers ───────────────────────────────────────────────────────────

    private static Deviation MakeDeviation(
        Guid? id = null,
        string title = "Test Deviation",
        string description = "Test description",
        DeviationStatus status = DeviationStatus.Registered,
        DeviationSeverity severity = DeviationSeverity.Medium,
        DeviationCategory category = DeviationCategory.Quality,
        string reportedBy = "tester@example.com") => new()
        {
            Id          = id ?? Guid.NewGuid(),
            Title       = title,
            Description = description,
            Status      = status,
            Severity    = severity,
            Category    = category,
            ReportedBy  = reportedBy,
        };

    private static (DeviationService svc, Mock<IDeviationRepository> repo) Build(
        IEnumerable<Deviation>? seed = null)
    {
        var list = (seed ?? []).ToList();
        var mock = new Mock<IDeviationRepository>();

        mock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => list.ToList());

        mock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) => list.FirstOrDefault(d => d.Id == id));

        mock.Setup(r => r.AddAsync(It.IsAny<Deviation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Deviation d, CancellationToken _) =>
            {
                list.Add(d);
                return d;
            });

        mock.Setup(r => r.UpdateAsync(It.IsAny<Deviation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Deviation d, CancellationToken _) => d);

        mock.Setup(r => r.DeleteAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid id, CancellationToken _) =>
            {
                var d = list.FirstOrDefault(x => x.Id == id);
                if (d is null) return false;
                list.Remove(d);
                return true;
            });

        return (new DeviationService(mock.Object), mock);
    }

    // ── GetDeviationsAsync ────────────────────────────────────────────────

    [Fact]
    public async Task GetDeviationsAsync_NoFilters_ReturnsAllDeviations()
    {
        var seed = new[] { MakeDeviation(), MakeDeviation() };
        var (svc, _) = Build(seed);

        var result = await svc.GetDeviationsAsync(new DeviationListQuery());

        result.TotalCount.Should().Be(2);
        result.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetDeviationsAsync_WithStatusFilter_ReturnsOnlyMatchingStatus()
    {
        var seed = new[]
        {
            MakeDeviation(status: DeviationStatus.Registered),
            MakeDeviation(status: DeviationStatus.Closed),
            MakeDeviation(status: DeviationStatus.Registered),
        };
        var (svc, _) = Build(seed);

        var result = await svc.GetDeviationsAsync(
            new DeviationListQuery(Status: DeviationStatus.Registered));

        result.TotalCount.Should().Be(2);
        result.Items.Should().AllSatisfy(d => d.Status.Should().Be(DeviationStatus.Registered));
    }

    [Fact]
    public async Task GetDeviationsAsync_WithSearch_ReturnsMatchingTitleOrDescription()
    {
        var seed = new[]
        {
            MakeDeviation(title: "Contamination issue"),
            MakeDeviation(title: "Noise complaint"),
        };
        var (svc, _) = Build(seed);

        var result = await svc.GetDeviationsAsync(new DeviationListQuery(Search: "contamination"));

        result.TotalCount.Should().Be(1);
        result.Items[0].Title.Should().Contain("Contamination");
    }

    [Fact]
    public async Task GetDeviationsAsync_Pagination_ReturnsCorrectPage()
    {
        var seed = Enumerable.Range(1, 10).Select(i => MakeDeviation(title: $"Dev {i:D2}")).ToList();
        var (svc, _) = Build(seed);

        var result = await svc.GetDeviationsAsync(new DeviationListQuery(Page: 2, PageSize: 3));

        result.Page.Should().Be(2);
        result.PageSize.Should().Be(3);
        result.Items.Should().HaveCount(3);
        result.TotalCount.Should().Be(10);
        result.TotalPages.Should().Be(4);
        result.HasPreviousPage.Should().BeTrue();
        result.HasNextPage.Should().BeTrue();
    }

    [Fact]
    public async Task GetDeviationsAsync_WithSeverityFilter_ReturnsOnlyMatchingSeverity()
    {
        var seed = new[]
        {
            MakeDeviation(severity: DeviationSeverity.Critical),
            MakeDeviation(severity: DeviationSeverity.Low),
        };
        var (svc, _) = Build(seed);

        var result = await svc.GetDeviationsAsync(
            new DeviationListQuery(Severity: DeviationSeverity.Critical));

        result.TotalCount.Should().Be(1);
        result.Items[0].Severity.Should().Be(DeviationSeverity.Critical);
    }

    // ── GetDeviationByIdAsync ─────────────────────────────────────────────

    [Fact]
    public async Task GetDeviationByIdAsync_ValidId_ReturnsDto()
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id)]);

        var result = await svc.GetDeviationByIdAsync(id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(id);
    }

    [Fact]
    public async Task GetDeviationByIdAsync_UnknownId_ReturnsNull()
    {
        var (svc, _) = Build();

        var result = await svc.GetDeviationByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    // ── CreateDeviationAsync ──────────────────────────────────────────────

    [Fact]
    public async Task CreateDeviationAsync_ValidRequest_ReturnsCreatedDto()
    {
        var (svc, _) = Build();

        var result = await svc.CreateDeviationAsync(new CreateDeviationRequest(
            Title: "New Deviation",
            Description: "Some description",
            Severity: DeviationSeverity.High,
            Category: DeviationCategory.Safety,
            ReportedBy: "user@example.com"));

        result.Id.Should().NotBeEmpty();
        result.Title.Should().Be("New Deviation");
        result.Status.Should().Be(DeviationStatus.Registered);
        result.Timeline.Should().ContainSingle(a => a.Type == ActivityType.Created);
    }

    [Fact]
    public async Task CreateDeviationAsync_EmptyTitle_ThrowsArgumentException()
    {
        var (svc, _) = Build();

        var act = () => svc.CreateDeviationAsync(new CreateDeviationRequest(
            Title: "   ",
            Description: "desc",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            ReportedBy: "user@example.com"));

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task CreateDeviationAsync_EmptyReportedBy_ThrowsArgumentException()
    {
        var (svc, _) = Build();

        var act = () => svc.CreateDeviationAsync(new CreateDeviationRequest(
            Title: "Title",
            Description: "desc",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            ReportedBy: string.Empty));

        await act.Should().ThrowAsync<ArgumentException>();
    }

    // ── UpdateDeviationAsync ──────────────────────────────────────────────

    [Fact]
    public async Task UpdateDeviationAsync_ValidId_UpdatesFields()
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id)]);

        var result = await svc.UpdateDeviationAsync(id, new UpdateDeviationRequest(
            Title: "Updated Title",
            Description: "Updated description",
            Severity: DeviationSeverity.Critical,
            Category: DeviationCategory.Environmental));

        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated Title");
        result.Severity.Should().Be(DeviationSeverity.Critical);
    }

    [Fact]
    public async Task UpdateDeviationAsync_UnknownId_ReturnsNull()
    {
        var (svc, _) = Build();

        var result = await svc.UpdateDeviationAsync(Guid.NewGuid(), new UpdateDeviationRequest(
            Title: "T",
            Description: "D",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other));

        result.Should().BeNull();
    }

    // ── DeleteDeviationAsync ──────────────────────────────────────────────

    [Fact]
    public async Task DeleteDeviationAsync_ValidId_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id)]);

        var deleted = await svc.DeleteDeviationAsync(id);

        deleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteDeviationAsync_UnknownId_ReturnsFalse()
    {
        var (svc, _) = Build();

        var deleted = await svc.DeleteDeviationAsync(Guid.NewGuid());

        deleted.Should().BeFalse();
    }

    // ── TransitionDeviationAsync ──────────────────────────────────────────

    [Theory]
    [InlineData(DeviationStatus.Registered,        DeviationStatus.UnderAssessment)]
    [InlineData(DeviationStatus.UnderAssessment,    DeviationStatus.UnderInvestigation)]
    [InlineData(DeviationStatus.UnderInvestigation, DeviationStatus.CorrectiveAction)]
    [InlineData(DeviationStatus.CorrectiveAction,   DeviationStatus.Closed)]
    [InlineData(DeviationStatus.Closed,             DeviationStatus.Registered)]
    public async Task TransitionDeviationAsync_ValidTransition_ChangesStatus(
        DeviationStatus from, DeviationStatus to)
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id, status: from)]);

        var (dto, error) = await svc.TransitionDeviationAsync(id,
            new TransitionDeviationRequest(NewStatus: to, PerformedBy: "operator@example.com"));

        error.Should().BeNull();
        dto.Should().NotBeNull();
        dto!.Status.Should().Be(to);
        dto.Timeline.Should().Contain(a => a.Type == ActivityType.StatusChanged);
    }

    [Theory]
    [InlineData(DeviationStatus.Registered,      DeviationStatus.CorrectiveAction)]
    [InlineData(DeviationStatus.UnderAssessment, DeviationStatus.Registered)]
    [InlineData(DeviationStatus.CorrectiveAction, DeviationStatus.UnderAssessment)]
    public async Task TransitionDeviationAsync_InvalidTransition_ReturnsError(
        DeviationStatus from, DeviationStatus to)
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id, status: from)]);

        var (dto, error) = await svc.TransitionDeviationAsync(id,
            new TransitionDeviationRequest(NewStatus: to, PerformedBy: "operator@example.com"));

        dto.Should().BeNull();
        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task TransitionDeviationAsync_UnknownId_ReturnsBothNull()
    {
        var (svc, _) = Build();

        var (dto, error) = await svc.TransitionDeviationAsync(Guid.NewGuid(),
            new TransitionDeviationRequest(
                NewStatus: DeviationStatus.UnderAssessment,
                PerformedBy: "user@example.com"));

        dto.Should().BeNull();
        error.Should().BeNull();
    }

    [Fact]
    public async Task TransitionDeviationAsync_WithComment_IncludesCommentInActivity()
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id, status: DeviationStatus.Registered)]);

        var (dto, _) = await svc.TransitionDeviationAsync(id,
            new TransitionDeviationRequest(
                NewStatus: DeviationStatus.UnderAssessment,
                PerformedBy: "user@example.com",
                Comment: "Needs immediate review"));

        dto!.Timeline
            .Should().Contain(a =>
                a.Type == ActivityType.StatusChanged &&
                a.Description.Contains("Needs immediate review"));
    }

    // ── AddCommentAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task AddCommentAsync_ValidRequest_AddsCommentToTimeline()
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id)]);

        var activity = await svc.AddCommentAsync(id,
            new AddCommentRequest("Investigated further.", "analyst@example.com"));

        activity.Should().NotBeNull();
        activity!.Type.Should().Be(ActivityType.CommentAdded);
        activity.Description.Should().Be("Investigated further.");
    }

    [Fact]
    public async Task AddCommentAsync_UnknownId_ReturnsNull()
    {
        var (svc, _) = Build();

        var result = await svc.AddCommentAsync(Guid.NewGuid(),
            new AddCommentRequest("Comment", "user@example.com"));

        result.Should().BeNull();
    }

    [Fact]
    public async Task AddCommentAsync_EmptyComment_ThrowsArgumentException()
    {
        var id = Guid.NewGuid();
        var (svc, _) = Build([MakeDeviation(id: id)]);

        var act = () => svc.AddCommentAsync(id, new AddCommentRequest("  ", "user@example.com"));

        await act.Should().ThrowAsync<ArgumentException>();
    }

    // ── ExportToCsvAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task ExportToCsvAsync_ReturnsHeaderRow()
    {
        var (svc, _) = Build([MakeDeviation()]);

        var csv = await svc.ExportToCsvAsync(new DeviationListQuery());

        csv.Should().StartWith("Id,Title,Status,Severity,Category,ReportedBy");
    }

    [Fact]
    public async Task ExportToCsvAsync_ContainsOneDataRowPerDeviation()
    {
        var seed = new[] { MakeDeviation(), MakeDeviation() };
        var (svc, _) = Build(seed);

        var csv = await svc.ExportToCsvAsync(new DeviationListQuery());

        // 1 header + 2 data rows + optional trailing newline
        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        lines.Should().HaveCount(3); // header + 2 rows
    }

    [Fact]
    public async Task ExportToCsvAsync_EscapesTitleWithComma()
    {
        var deviation = MakeDeviation(title: "Spill, zone B");
        var (svc, _) = Build([deviation]);

        var csv = await svc.ExportToCsvAsync(new DeviationListQuery());

        csv.Should().Contain("\"Spill, zone B\"");
    }
}
