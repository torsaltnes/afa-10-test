using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.Health;

/// <summary>
/// Integration tests for GET /health using an in-process
/// <see cref="WebApplicationFactory{TEntryPoint}"/>.
/// </summary>
public sealed class HealthEndpointsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // ── Status code ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetHealth_ReturnsOk_WhenHealthy()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Content-type ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetHealth_ContentType_IsApplicationJson()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    // ── Enum serialisation ────────────────────────────────────────────────

    [Fact]
    public async Task GetHealth_StatusField_IsStringEnumValue()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);

        var status = doc.RootElement.GetProperty("status").GetString();

        // Frontend contract requires string enum values, not integers.
        new[] { "Healthy", "Degraded", "Unhealthy" }.Should().Contain(status);
    }

    // ── Payload shape ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetHealth_Response_ContainsAllRequiredFields()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.TryGetProperty("status",       out _).Should().BeTrue();
        root.TryGetProperty("serviceName",  out _).Should().BeTrue();
        root.TryGetProperty("environment",  out _).Should().BeTrue();
        root.TryGetProperty("version",      out _).Should().BeTrue();
        root.TryGetProperty("timestampUtc", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetHealth_ServiceName_MatchesConfiguration()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);

        doc.RootElement
           .GetProperty("serviceName")
           .GetString()
           .Should().Be("Greenfield.Api");
    }
}
