using FluentAssertions;
using GreenfieldArchitecture.Application.Abstractions.Health;
using GreenfieldArchitecture.Application.Health.Queries;
using GreenfieldArchitecture.Application.Health.Services;
using GreenfieldArchitecture.Domain.Health;
using Moq;
using Xunit;

namespace GreenfieldArchitecture.Application.Tests.Health;

public sealed class HealthServiceTests
{
    private static readonly DateTimeOffset FixedUtcNow =
        new(2024, 6, 15, 12, 0, 0, TimeSpan.Zero);

    private readonly Mock<IApplicationMetadataProvider> _metadataProviderMock;
    private readonly TimeProvider _fakeTimeProvider;
    private readonly HealthService _sut;

    public HealthServiceTests()
    {
        _metadataProviderMock = new Mock<IApplicationMetadataProvider>(MockBehavior.Strict);

        var timeProviderMock = new Mock<TimeProvider>();
        timeProviderMock
            .Setup(tp => tp.GetUtcNow())
            .Returns(FixedUtcNow);
        _fakeTimeProvider = timeProviderMock.Object;

        _sut = new HealthService(_metadataProviderMock.Object, _fakeTimeProvider);
    }

    [Fact]
    public async Task GetAsync_ReturnsHealthyStatus()
    {
        // Arrange
        _metadataProviderMock
            .Setup(p => p.GetMetadata())
            .Returns(new ApplicationMetadata("TestService", "1.0.0", "Testing"));

        // Act
        var result = await _sut.GetAsync(new GetHealthStatusQuery());

        // Assert
        result.Status.Should().Be(nameof(HealthState.Healthy));
    }

    [Fact]
    public async Task GetAsync_MapsMetadataFieldsCorrectly()
    {
        // Arrange
        var metadata = new ApplicationMetadata(
            ServiceName: "MyService",
            Version: "2.3.1",
            EnvironmentName: "Production");

        _metadataProviderMock
            .Setup(p => p.GetMetadata())
            .Returns(metadata);

        // Act
        var result = await _sut.GetAsync(new GetHealthStatusQuery());

        // Assert
        result.ServiceName.Should().Be(metadata.ServiceName);
        result.Version.Should().Be(metadata.Version);
        result.Environment.Should().Be(metadata.EnvironmentName);
    }

    [Fact]
    public async Task GetAsync_UsesTimestampFromInjectedTimeProvider()
    {
        // Arrange
        _metadataProviderMock
            .Setup(p => p.GetMetadata())
            .Returns(new ApplicationMetadata("TestService", "1.0.0", "Testing"));

        // Act
        var result = await _sut.GetAsync(new GetHealthStatusQuery());

        // Assert — must come from the fake TimeProvider, not DateTime.UtcNow
        result.CheckedAtUtc.Should().Be(FixedUtcNow);
    }

    [Fact]
    public async Task GetAsync_CancellationToken_DoesNotThrowWhenNotCancelled()
    {
        // Arrange
        using var cts = new CancellationTokenSource();
        _metadataProviderMock
            .Setup(p => p.GetMetadata())
            .Returns(new ApplicationMetadata("TestService", "1.0.0", "Testing"));

        // Act
        var act = () => _sut.GetAsync(new GetHealthStatusQuery(), cts.Token);

        // Assert
        await act.Should().NotThrowAsync();
    }
}
