using Greenfield.Api.Contracts;
using Greenfield.Api.Controllers;
using Greenfield.Application.Abstractions.Health;
using Greenfield.Application.Health;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Greenfield.Api.Tests.Controllers;

public class HealthCheckControllerTests
{
    private readonly Mock<IHealthCheckService> _healthCheckServiceMock;
    private readonly HealthCheckController _sut;

    public HealthCheckControllerTests()
    {
        _healthCheckServiceMock = new Mock<IHealthCheckService>();
        _sut = new HealthCheckController(_healthCheckServiceMock.Object);
    }

    [Fact]
    public async Task Get_returns_ok_result()
    {
        // Arrange
        var fakeResult = new HealthCheckResult(
            Status: "Healthy",
            ApplicationName: "TestApp",
            Environment: "Testing",
            CheckedAtUtc: DateTimeOffset.UtcNow);

        _healthCheckServiceMock
            .Setup(s => s.GetCurrentAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(fakeResult);

        // Act
        var actionResult = await _sut.Get(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Get_maps_application_result_to_api_contract()
    {
        // Arrange
        var checkedAt = new DateTimeOffset(2026, 4, 25, 12, 0, 0, TimeSpan.Zero);
        var fakeResult = new HealthCheckResult(
            Status: "Healthy",
            ApplicationName: "Greenfield.Api",
            Environment: "Production",
            CheckedAtUtc: checkedAt);

        _healthCheckServiceMock
            .Setup(s => s.GetCurrentAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(fakeResult);

        // Act
        var actionResult = await _sut.Get(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<HealthCheckResponse>(okResult.Value);
        Assert.Equal("Healthy", response.Status);
        Assert.Equal("Greenfield.Api", response.ApplicationName);
        Assert.Equal("Production", response.Environment);
        Assert.Equal(checkedAt, response.CheckedAtUtc);
    }

    [Fact]
    public async Task Get_passes_cancellation_token_to_service()
    {
        // Arrange
        using var cts = new CancellationTokenSource();
        var token = cts.Token;

        var fakeResult = new HealthCheckResult(
            Status: "Healthy",
            ApplicationName: "TestApp",
            Environment: "Testing",
            CheckedAtUtc: DateTimeOffset.UtcNow);

        _healthCheckServiceMock
            .Setup(s => s.GetCurrentAsync(token))
            .ReturnsAsync(fakeResult);

        // Act
        await _sut.Get(token);

        // Assert
        _healthCheckServiceMock.Verify(
            s => s.GetCurrentAsync(token),
            Times.Once);
    }
}
