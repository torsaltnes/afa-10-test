using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.Tests.Endpoints;

public class HealthCheckEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthCheckEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_health_returns_200_ok()
    {
        // Act
        var response = await _client.GetAsync("/api/health", TestContext.Current.CancellationToken);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Get_health_returns_json_with_expected_shape()
    {
        // Act
        var response = await _client.GetAsync("/api/health", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>(
            TestContext.Current.CancellationToken);

        // Assert
        Assert.NotNull(body);
        Assert.True(body.ContainsKey("status"), "Response must contain 'status'");
        Assert.True(body.ContainsKey("applicationName"), "Response must contain 'applicationName'");
        Assert.True(body.ContainsKey("environment"), "Response must contain 'environment'");
        Assert.True(body.ContainsKey("checkedAtUtc"), "Response must contain 'checkedAtUtc'");
    }

    [Fact]
    public async Task Get_health_returns_healthy_status()
    {
        // Act
        var response = await _client.GetAsync("/api/health", TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>(
            TestContext.Current.CancellationToken);

        // Assert
        Assert.NotNull(body);
        Assert.Equal("Healthy", body["status"].ToString());
    }
}
