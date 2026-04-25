using Greenfield.Application.Health;
using Greenfield.Infrastructure.Services;
using Microsoft.Extensions.Hosting;
using Moq;
using Xunit;

namespace Greenfield.Api.Tests.Services;

public class SystemHealthCheckServiceTests
{
    private readonly Mock<TimeProvider> _timeProviderMock;
    private readonly Mock<IHostEnvironment> _hostEnvironmentMock;
    private readonly SystemHealthCheckService _sut;

    public SystemHealthCheckServiceTests()
    {
        _timeProviderMock = new Mock<TimeProvider>();
        _hostEnvironmentMock = new Mock<IHostEnvironment>();
        _sut = new SystemHealthCheckService(_timeProviderMock.Object, _hostEnvironmentMock.Object);
    }

    [Fact]
    public async Task GetCurrentAsync_always_returns_healthy_status()
    {
        // Arrange
        _timeProviderMock
            .Setup(tp => tp.GetUtcNow())
            .Returns(DateTimeOffset.UtcNow);
        _hostEnvironmentMock.Setup(e => e.ApplicationName).Returns("App");
        _hostEnvironmentMock.Setup(e => e.EnvironmentName).Returns("Testing");

        // Act
        var result = await _sut.GetCurrentAsync(CancellationToken.None);

        // Assert
        Assert.Equal("Healthy", result.Status);
    }

    [Fact]
    public async Task GetCurrentAsync_sources_application_name_from_host_environment()
    {
        // Arrange
        const string expectedAppName = "MyApplication";
        _timeProviderMock
            .Setup(tp => tp.GetUtcNow())
            .Returns(DateTimeOffset.UtcNow);
        _hostEnvironmentMock.Setup(e => e.ApplicationName).Returns(expectedAppName);
        _hostEnvironmentMock.Setup(e => e.EnvironmentName).Returns("Testing");

        // Act
        var result = await _sut.GetCurrentAsync(CancellationToken.None);

        // Assert
        Assert.Equal(expectedAppName, result.ApplicationName);
    }

    [Fact]
    public async Task GetCurrentAsync_sources_environment_name_from_host_environment()
    {
        // Arrange
        const string expectedEnv = "Staging";
        _timeProviderMock
            .Setup(tp => tp.GetUtcNow())
            .Returns(DateTimeOffset.UtcNow);
        _hostEnvironmentMock.Setup(e => e.ApplicationName).Returns("App");
        _hostEnvironmentMock.Setup(e => e.EnvironmentName).Returns(expectedEnv);

        // Act
        var result = await _sut.GetCurrentAsync(CancellationToken.None);

        // Assert
        Assert.Equal(expectedEnv, result.Environment);
    }

    [Fact]
    public async Task GetCurrentAsync_sources_timestamp_from_time_provider()
    {
        // Arrange
        var expectedTime = new DateTimeOffset(2026, 4, 25, 10, 30, 0, TimeSpan.Zero);
        _timeProviderMock
            .Setup(tp => tp.GetUtcNow())
            .Returns(expectedTime);
        _hostEnvironmentMock.Setup(e => e.ApplicationName).Returns("App");
        _hostEnvironmentMock.Setup(e => e.EnvironmentName).Returns("Testing");

        // Act
        var result = await _sut.GetCurrentAsync(CancellationToken.None);

        // Assert
        Assert.Equal(expectedTime, result.CheckedAtUtc);
    }
}
