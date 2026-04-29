using FluentAssertions;
using Greenfield.Application.Health;
using Greenfield.Domain.Health;
using Greenfield.Infrastructure.Health;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Moq;
using Xunit;

namespace Greenfield.Application.UnitTests.Health;

/// <summary>
/// Unit tests for <see cref="HealthStatusService"/> verifying that
/// environment, version, service-name, timestamp, and health-state
/// are mapped correctly onto the <see cref="HealthStatusDto"/>.
/// </summary>
public sealed class HealthStatusServiceTests
{
    // ── Helpers ───────────────────────────────────────────────────────────

    private static Mock<HealthCheckService> BuildHealthCheckServiceMock(HealthStatus status)
    {
        var mock = new Mock<HealthCheckService>();
        mock.Setup(s => s.CheckHealthAsync(
                It.IsAny<Func<HealthCheckRegistration, bool>?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HealthReport(
                new Dictionary<string, HealthReportEntry>(),
                status,
                TimeSpan.FromMilliseconds(1)));
        return mock;
    }

    private static HealthStatusService Build(
        HealthStatus healthStatus  = HealthStatus.Healthy,
        string       environment   = "Development",
        string       serviceName   = "TestService",
        string       version       = "2.0.0")
    {
        var envMock = new Mock<IWebHostEnvironment>();
        envMock.Setup(e => e.EnvironmentName).Returns(environment);

        var cfgMock = new Mock<IConfiguration>();
        cfgMock.Setup(c => c["AppSettings:ServiceName"]).Returns(serviceName);
        cfgMock.Setup(c => c["AppSettings:Version"]).Returns(version);

        return new HealthStatusService(
            BuildHealthCheckServiceMock(healthStatus).Object,
            envMock.Object,
            cfgMock.Object);
    }

    // ── HealthState mapping ───────────────────────────────────────────────

    [Fact]
    public async Task GetHealthStatusAsync_WhenHealthy_ReturnsHealthyState()
    {
        var sut = Build(HealthStatus.Healthy);

        var result = await sut.GetHealthStatusAsync();

        result.Status.Should().Be(HealthState.Healthy);
    }

    [Fact]
    public async Task GetHealthStatusAsync_WhenDegraded_ReturnsDegradedState()
    {
        var sut = Build(HealthStatus.Degraded);

        var result = await sut.GetHealthStatusAsync();

        result.Status.Should().Be(HealthState.Degraded);
    }

    [Fact]
    public async Task GetHealthStatusAsync_WhenUnhealthy_ReturnsUnhealthyState()
    {
        var sut = Build(HealthStatus.Unhealthy);

        var result = await sut.GetHealthStatusAsync();

        result.Status.Should().Be(HealthState.Unhealthy);
    }

    // ── Metadata mapping ──────────────────────────────────────────────────

    [Fact]
    public async Task GetHealthStatusAsync_MapsEnvironmentName_Correctly()
    {
        var sut = Build(environment: "Staging");

        var result = await sut.GetHealthStatusAsync();

        result.Environment.Should().Be("Staging");
    }

    [Fact]
    public async Task GetHealthStatusAsync_MapsVersion_Correctly()
    {
        var sut = Build(version: "3.1.4");

        var result = await sut.GetHealthStatusAsync();

        result.Version.Should().Be("3.1.4");
    }

    [Fact]
    public async Task GetHealthStatusAsync_MapsServiceName_Correctly()
    {
        var sut = Build(serviceName: "MyApp");

        var result = await sut.GetHealthStatusAsync();

        result.ServiceName.Should().Be("MyApp");
    }

    // ── Timestamp ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetHealthStatusAsync_TimestampUtc_IsBetweenBeforeAndAfterCall()
    {
        var before = DateTimeOffset.UtcNow;
        var sut    = Build();

        var result = await sut.GetHealthStatusAsync();

        var after = DateTimeOffset.UtcNow;
        result.TimestampUtc.Should().BeOnOrAfter(before)
            .And.BeOnOrBefore(after);
    }

    [Fact]
    public async Task GetHealthStatusAsync_TimestampUtc_HasZeroUtcOffset()
    {
        var sut = Build();

        var result = await sut.GetHealthStatusAsync();

        result.TimestampUtc.Offset.Should().Be(TimeSpan.Zero,
            because: "timestamps must be UTC for correct ISO-8601 serialisation");
    }
}
