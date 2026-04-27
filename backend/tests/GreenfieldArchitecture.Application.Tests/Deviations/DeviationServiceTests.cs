using FluentAssertions;
using GreenfieldArchitecture.Application.Deviations.Abstractions;
using GreenfieldArchitecture.Application.Deviations.Contracts;
using GreenfieldArchitecture.Application.Deviations.Services;
using GreenfieldArchitecture.Domain.Deviations;
using Moq;
using Xunit;

namespace GreenfieldArchitecture.Application.Tests.Deviations;

public sealed class DeviationServiceTests
{
    private static readonly DateTimeOffset FixedUtcNow =
        new(2024, 9, 1, 10, 0, 0, TimeSpan.Zero);

    private readonly Mock<IDeviationRepository> _repositoryMock;
    private readonly Mock<TimeProvider> _timeProviderMock;
    private readonly DeviationService _sut;

    public DeviationServiceTests()
    {
        _repositoryMock = new Mock<IDeviationRepository>(MockBehavior.Strict);

        _timeProviderMock = new Mock<TimeProvider>();
        _timeProviderMock
            .Setup(tp => tp.GetUtcNow())
            .Returns(FixedUtcNow);

        _sut = new DeviationService(_repositoryMock.Object, _timeProviderMock.Object);
    }

    // ── GetAllAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllAsync_ReturnsMappedDtos()
    {
        // Arrange
        var deviation = MakeDeviation();
        _repositoryMock
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([deviation]);

        // Act
        var result = await _sut.GetAllAsync();

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(deviation.Id);
        result[0].Title.Should().Be(deviation.Title);
    }

    // ── GetByIdAsync ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsMappedDto()
    {
        // Arrange
        var deviation = MakeDeviation();
        _repositoryMock
            .Setup(r => r.GetByIdAsync(deviation.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deviation);

        // Act
        var result = await _sut.GetByIdAsync(deviation.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(deviation.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WhenNotFound_ReturnsNull()
    {
        // Arrange
        var missingId = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.GetByIdAsync(missingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Deviations.Deviation?)null);

        // Act
        var result = await _sut.GetByIdAsync(missingId);

        // Assert
        result.Should().BeNull();
    }

    // ── CreateAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_SetsTimestampsAndNewId()
    {
        // Arrange
        var request = new CreateDeviationRequest(
            Title: "Missing label",
            Description: "Product label missing from batch",
            Severity: DeviationSeverity.High,
            Status: DeviationStatus.Open,
            ReportedBy: "alice");

        _repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Domain.Deviations.Deviation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Deviations.Deviation d, CancellationToken _) => d);

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Id.Should().NotBe(Guid.Empty);
        result.ReportedAt.Should().Be(FixedUtcNow);
        result.UpdatedAt.Should().Be(FixedUtcNow);
        result.Title.Should().Be(request.Title);
    }

    [Theory]
    [InlineData("", "desc", "user")]
    [InlineData("title", "", "user")]
    [InlineData("title", "desc", "")]
    public async Task CreateAsync_WithBlankRequiredField_ThrowsArgumentException(
        string title, string description, string reportedBy)
    {
        // Arrange
        var request = new CreateDeviationRequest(title, description, DeviationSeverity.Low, DeviationStatus.Open, reportedBy);

        // Act
        var act = () => _sut.CreateAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>();
    }

    // ── UpdateAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_PreservesReportedAtAndRefreshesUpdatedAt()
    {
        // Arrange
        var originalReportedAt = FixedUtcNow.AddDays(-5);
        var deviation = MakeDeviation(reportedAt: originalReportedAt, updatedAt: originalReportedAt);

        _repositoryMock
            .Setup(r => r.GetByIdAsync(deviation.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deviation);
        _repositoryMock
            .Setup(r => r.UpdateAsync(deviation, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deviation);

        var request = new UpdateDeviationRequest(
            Title: "Updated title",
            Description: "Updated desc",
            Severity: DeviationSeverity.Medium,
            Status: DeviationStatus.InProgress,
            ReportedBy: "bob");

        // Act
        var result = await _sut.UpdateAsync(deviation.Id, request);

        // Assert
        result.Should().NotBeNull();
        result!.ReportedAt.Should().Be(originalReportedAt, "ReportedAt must not change on update");
        result.UpdatedAt.Should().Be(FixedUtcNow, "UpdatedAt must be refreshed to now");
        result.Title.Should().Be("Updated title");
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsNull()
    {
        // Arrange
        var missingId = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.GetByIdAsync(missingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Deviations.Deviation?)null);

        var request = new UpdateDeviationRequest("t", "d", DeviationSeverity.Low, DeviationStatus.Open, "u");

        // Act
        var result = await _sut.UpdateAsync(missingId, request);

        // Assert
        result.Should().BeNull();
    }

    // ── DeleteAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_WhenExists_ReturnsTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.DeleteAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.DeleteAsync(id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.DeleteAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.DeleteAsync(id);

        // Assert
        result.Should().BeFalse();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static Domain.Deviations.Deviation MakeDeviation(
        DateTimeOffset? reportedAt = null,
        DateTimeOffset? updatedAt = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            Title = "Test deviation",
            Description = "Test description",
            Severity = DeviationSeverity.Low,
            Status = DeviationStatus.Open,
            ReportedBy = "tester",
            ReportedAt = reportedAt ?? FixedUtcNow,
            UpdatedAt = updatedAt ?? FixedUtcNow,
        };
}
