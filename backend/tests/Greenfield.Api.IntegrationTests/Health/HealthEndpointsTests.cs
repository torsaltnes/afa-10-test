using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.Health;

/// <summary>
/// Integration tests for the health endpoints using an in-process
/// <see cref="WebApplicationFactory{TEntryPoint}"/>.
/// Covers both the canonical <c>/api/health</c> route and the
/// backward-compatible <c>/health</c> alias.
/// </summary>
public sealed class HealthEndpointsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // ══════════════════════════════════════════════════════════════════════
    // Canonical route: /api/health
    // ══════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetHealth_CanonicalRoute_ReturnsOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "/api/health is the canonical health route and must always be reachable");
    }

    [Fact]
    public async Task GetHealth_CanonicalRoute_ContentType_IsApplicationJson()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetHealth_CanonicalRoute_StatusField_IsStringEnumValue()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);

        var status = doc.RootElement.GetProperty("status").GetString();

        new[] { "Healthy", "Degraded", "Unhealthy" }.Should().Contain(status);
    }

    [Fact]
    public async Task GetHealth_CanonicalRoute_Response_ContainsAllRequiredFields()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");
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
    public async Task GetHealth_CanonicalRoute_ServiceName_MatchesConfiguration()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);

        doc.RootElement
           .GetProperty("serviceName")
           .GetString()
           .Should().Be("Greenfield.Api");
    }

    // ══════════════════════════════════════════════════════════════════════
    // Backward-compatible alias: /health
    // Regression guard — if the alias is ever removed these tests will fail,
    // alerting maintainers that callers using the old path will break.
    // ══════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetHealth_AliasRoute_ReturnsOk_WhenHealthy()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "/health alias must continue to work for existing callers");
    }

    [Fact]
    public async Task GetHealth_AliasRoute_ContentType_IsApplicationJson()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetHealth_AliasRoute_StatusField_IsStringEnumValue()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");
        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);

        var status = doc.RootElement.GetProperty("status").GetString();

        new[] { "Healthy", "Degraded", "Unhealthy" }.Should().Contain(status);
    }

    [Fact]
    public async Task GetHealth_AliasRoute_Response_ContainsAllRequiredFields()
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
    public async Task GetHealth_AliasRoute_ServiceName_MatchesConfiguration()
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

    // ══════════════════════════════════════════════════════════════════════
    // Parity — both routes must return identical payloads
    // ══════════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetHealth_CanonicalAndAlias_ReturnIdenticalPayloadShape()
    {
        var client = factory.CreateClient();

        var canonical = await (await client.GetAsync("/api/health")).Content.ReadAsStringAsync();
        var alias     = await (await client.GetAsync("/health")).Content.ReadAsStringAsync();

        var canonicalDoc = JsonDocument.Parse(canonical);
        var aliasDoc     = JsonDocument.Parse(alias);

        // Both must have the same top-level property names.
        var canonicalProps = canonicalDoc.RootElement.EnumerateObject().Select(p => p.Name).ToHashSet();
        var aliasProps     = aliasDoc.RootElement.EnumerateObject().Select(p => p.Name).ToHashSet();
        aliasProps.Should().BeEquivalentTo(canonicalProps,
            because: "both routes must expose the same contract shape");
    }
}
