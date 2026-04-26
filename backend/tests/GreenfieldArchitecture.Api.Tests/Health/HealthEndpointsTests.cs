using System.Net;
using System.Text.Json;
using FluentAssertions;
using GreenfieldArchitecture.Api.Tests.Infrastructure;
using Xunit;

namespace GreenfieldArchitecture.Api.Tests.Health;

public sealed class HealthEndpointsTests : IClassFixture<GreenfieldArchitectureApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _client;

    public HealthEndpointsTests(GreenfieldArchitectureApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetApiHealth_Returns200Ok()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetApiHealth_ResponseMatchesDtoContract()
    {
        // Act
        var response = await _client.GetAsync("/api/health");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        // Assert — required fields must be present and non-empty
        root.TryGetProperty("status", out var statusProp).Should().BeTrue("'status' field is required");
        statusProp.GetString().Should().NotBeNullOrWhiteSpace();

        root.TryGetProperty("serviceName", out var serviceNameProp).Should().BeTrue("'serviceName' field is required");
        serviceNameProp.GetString().Should().NotBeNullOrWhiteSpace();

        root.TryGetProperty("version", out var versionProp).Should().BeTrue("'version' field is required");
        versionProp.GetString().Should().NotBeNullOrWhiteSpace();

        root.TryGetProperty("environment", out var envProp).Should().BeTrue("'environment' field is required");
        envProp.GetString().Should().NotBeNullOrWhiteSpace();

        root.TryGetProperty("checkedAtUtc", out var checkedAtProp).Should().BeTrue("'checkedAtUtc' field is required");
        checkedAtProp.TryGetDateTimeOffset(out _).Should().BeTrue("'checkedAtUtc' must be a valid date-time");
    }

    [Fact]
    public async Task GetApiHealth_StatusIsHealthy()
    {
        // Act
        var response = await _client.GetAsync("/api/health");
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);

        // Assert
        doc.RootElement
            .GetProperty("status")
            .GetString()
            .Should().Be("Healthy");
    }

    [Fact]
    public async Task GetHealthLive_Returns200Ok()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
