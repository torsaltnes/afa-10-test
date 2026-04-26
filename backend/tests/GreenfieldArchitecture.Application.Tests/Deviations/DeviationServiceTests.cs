using FluentAssertions;
using GreenfieldArchitecture.Application.Abstractions.Deviations;
using GreenfieldArchitecture.Application.Deviations.Commands;
using GreenfieldArchitecture.Application.Deviations.Queries;
using GreenfieldArchitecture.Application.Deviations.Services;
using GreenfieldArchitecture.Domain.Deviations;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace GreenfieldArchitecture.Application.Tests.Deviations;

public sealed class DeviationServiceTests
{
    private static readonly DateTimeOffset FixedNow =
        new(2024, 8, 20, 10, 0, 0, TimeSpan.Zero);

    private readonly Mock<IDeviationRepository> _repoMock;
    private readonly Mock<TimeProvider> _timeProviderMock;
    private readonly Mock<ILogger<DeviationService>> _loggerMock;
    private readonly DeviationService _sut;

    public DeviationServiceTests()
    {
        _repoMock = new Mock<IDeviationRepository>(MockBehavior.Strict);
        _timeProviderMock = new Mock<TimeProvider>();
        _timeProviderMock.Setup(tp => tp.GetUtcNow()).Returns(FixedNow);
        _loggerMock = new Mock<ILogger<DeviationService>>();

        _sut = new DeviationService(_repoMock.Object, _timeProviderMock.Object, _loggerMock.Object);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_AssignsIdAndTimestampsAndDefaultsStatusToOpen()
    {
        // Arrange
        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Deviation>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new CreateDeviationCommand("Title", "Description", DeviationSeverity.High, DeviationStatus.Open);

        // Act
        var dto = await _sut.CreateAsync(command);

        // Assert
        dto.Id.Should().NotBe(Guid.Empty);
        dto.CreatedAtUtc.Should().Be(FixedNow);
        dto.LastModifiedAtUtc.Should().Be(FixedNow);
        dto.Status.Should().Be(nameof(DeviationStatus.Open));
    }

    [Theory]
    [InlineData("", "Description")]
    [InlineData("   ", "Description")]
    [InlineData("Title", "")]
    [InlineData("Title", "   ")]
    public async Task CreateAsync_RejectsBlankTitleOrDescription(string title, string description)
    {
        // Arrange
        var command = new CreateDeviationCommand(title, description, DeviationSeverity.Low, DeviationStatus.Open);

        // Act
        var act = () => _sut.CreateAsync(command);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task CreateAsync_SetsCorrectSeverityAndStatus()
    {
        // Arrange
        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Deviation>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new CreateDeviationCommand("T", "D", DeviationSeverity.Critical, DeviationStatus.Investigating);

        // Act
        var dto = await _sut.CreateAsync(command);

        // Assert
        dto.Severity.Should().Be(nameof(DeviationSeverity.Critical));
        dto.Status.Should().Be(nameof(DeviationStatus.Investigating));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task ListAsync_ReturnsItemsDescendingByLastModifiedAtUtc()
    {
        // Arrange
        var older = MakeDeviation(FixedNow.AddMinutes(-10));
        var newer = MakeDeviation(FixedNow);

        _repoMock
            .Setup(r => r.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([older, newer]);

        // Act
        var result = await _sut.ListAsync(new ListDeviationsQuery());

        // Assert
        result.Should().HaveCount(2);
        result[0].LastModifiedAtUtc.Should().BeAfter(result[1].LastModifiedAtUtc);
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock
            .Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Deviation?)null);

        // Act
        var result = await _sut.GetByIdAsync(new GetDeviationByIdQuery(id));

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsDto_WhenFound()
    {
        // Arrange
        var deviation = MakeDeviation(FixedNow);
        _repoMock
            .Setup(r => r.GetByIdAsync(deviation.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deviation);

        // Act
        var result = await _sut.GetByIdAsync(new GetDeviationByIdQuery(deviation.Id));

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(deviation.Id);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenRepositoryItemIsMissing()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock
            .Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Deviation?)null);

        var command = new UpdateDeviationCommand(id, "T", "D", DeviationSeverity.Low, DeviationStatus.Closed);

        // Act
        var result = await _sut.UpdateAsync(command);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_PreservesCreatedAtUtcAndChangesLastModifiedAtUtc()
    {
        // Arrange
        var originalCreatedAt = FixedNow.AddDays(-1);
        var deviation = MakeDeviation(originalCreatedAt);

        _repoMock
            .Setup(r => r.GetByIdAsync(deviation.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(deviation);

        _repoMock
            .Setup(r => r.UpdateAsync(It.IsAny<Deviation>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var later = FixedNow.AddHours(1);
        _timeProviderMock.Setup(tp => tp.GetUtcNow()).Returns(later);

        var command = new UpdateDeviationCommand(deviation.Id, "Updated", "Updated desc", DeviationSeverity.Medium, DeviationStatus.Resolved);

        // Act
        var result = await _sut.UpdateAsync(command);

        // Assert
        result.Should().NotBeNull();
        result!.CreatedAtUtc.Should().Be(originalCreatedAt);
        result.LastModifiedAtUtc.Should().Be(later);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock
            .Setup(r => r.DeleteAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.DeleteAsync(new DeleteDeviationCommand(id));

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_ReturnsTrue_WhenFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock
            .Setup(r => r.DeleteAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.DeleteAsync(new DeleteDeviationCommand(id));

        // Assert
        result.Should().BeTrue();
    }

    // ── Severity/Status Mapping ───────────────────────────────────────────────

    [Theory]
    [InlineData(DeviationSeverity.Low, "Low")]
    [InlineData(DeviationSeverity.Medium, "Medium")]
    [InlineData(DeviationSeverity.High, "High")]
    [InlineData(DeviationSeverity.Critical, "Critical")]
    public async Task CreateAsync_OutputsCanonicalSeverityString(DeviationSeverity severity, string expected)
    {
        // Arrange
        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Deviation>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new CreateDeviationCommand("T", "D", severity, DeviationStatus.Open);

        // Act
        var dto = await _sut.CreateAsync(command);

        // Assert
        dto.Severity.Should().Be(expected);
    }

    [Theory]
    [InlineData(DeviationStatus.Open, "Open")]
    [InlineData(DeviationStatus.Investigating, "Investigating")]
    [InlineData(DeviationStatus.Resolved, "Resolved")]
    [InlineData(DeviationStatus.Closed, "Closed")]
    public async Task CreateAsync_OutputsCanonicalStatusString(DeviationStatus status, string expected)
    {
        // Arrange
        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Deviation>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var command = new CreateDeviationCommand("T", "D", DeviationSeverity.Low, status);

        // Act
        var dto = await _sut.CreateAsync(command);

        // Assert
        dto.Status.Should().Be(expected);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Deviation MakeDeviation(DateTimeOffset ts) =>
        Deviation.Create("Test deviation", "Test description", DeviationSeverity.Low, DeviationStatus.Open, ts);
}
