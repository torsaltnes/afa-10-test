using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.Deviations;

/// <summary>
/// Proxy-route regression tests for the <c>/api/deviations</c> route group.
/// Verifies that the minimal API routes are correctly registered and return the
/// expected HTTP contract (status, content-type, and payload shape).
/// These tests focus on routing correctness, not business logic — they should
/// fail loudly on 404 before any body-validation code is reached.
/// </summary>
public sealed class DeviationEndpointRouteTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // ── GET /api/deviations (canonical, no trailing slash) ────────────────

    [Fact]
    public async Task GetDeviations_CanonicalRoute_ReturnsOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/deviations");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "canonical /api/deviations must be registered without trailing slash");
    }

    [Fact]
    public async Task GetDeviations_ReturnsApplicationJson()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/deviations");

        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task GetDeviations_ReturnsPagedResultEnvelope()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/deviations");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var doc  = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.TryGetProperty("items", out var items)
            .Should().BeTrue("the response must contain an 'items' property");

        items.ValueKind.Should().Be(JsonValueKind.Array,
            because: "'items' must be a JSON array so the frontend can iterate over results");

        root.TryGetProperty("totalCount", out _).Should().BeTrue();
        root.TryGetProperty("page",       out _).Should().BeTrue();
        root.TryGetProperty("pageSize",   out _).Should().BeTrue();
    }

    // ── GET /api/deviations/export ────────────────────────────────────────

    [Fact]
    public async Task GetDeviationsExport_RouteIsReachable_Returns200()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/deviations/export");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "/api/deviations/export must be registered above the /{id:guid} capture");
    }

    [Fact]
    public async Task GetDeviationsExport_Returns_CsvContentType()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/deviations/export");
        response.EnsureSuccessStatusCode();

        response.Content.Headers.ContentType?.MediaType.Should().Be("text/csv");
    }

    // ── GET /api/deviations/{id} ──────────────────────────────────────────

    [Fact]
    public async Task GetDeviationById_KnownSeedId_ReturnsOk_NotNotFound()
    {
        var client = factory.CreateClient();

        // Uses a well-known seed ID so routing is tested with a valid GUID,
        // ensuring we can distinguish a routing 404 from a business 404.
        var response = await client.GetAsync(
            $"/api/deviations/{Greenfield.Infrastructure.Deviations.DeviationSeedData.Dev001Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "retrieving a seeded deviation by ID must succeed and not return 404");
    }

    // ── POST /api/deviations (canonical, no trailing slash) ───────────────

    [Fact]
    public async Task PostDeviations_CanonicalRoute_IsReachable()
    {
        var client = factory.CreateClient();

        // Send a minimal valid body so the endpoint can process the request.
        // Any non-404 response proves the route is registered correctly.
        using var content = new System.Net.Http.StringContent(
            """{"title":"Route test","description":"desc","severity":"Low","category":"Other","reportedBy":"test@example.com"}""",
            System.Text.Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("/api/deviations", content);

        response.StatusCode.Should().NotBe(HttpStatusCode.NotFound,
            because: "POST /api/deviations (no trailing slash) must be registered");

        // BeOneOf with explicit collection to avoid FluentAssertions 7 params/because conflict.
        var acceptable = new[] { HttpStatusCode.Created, HttpStatusCode.BadRequest };
        response.StatusCode.Should().BeOneOf(acceptable,
            because: "endpoint must process the request — 404 indicates a routing failure");
    }
}
