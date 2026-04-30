using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.Deviations;

/// <summary>
/// Proxy-route regression tests for <c>GET /api/deviations</c>.
/// Verifies that the minimal API route is correctly registered and returns
/// the expected HTTP contract (status, content-type, and payload shape).
/// Uses a real <see cref="WebApplicationFactory{TEntryPoint}"/> in-process host
/// — no mocking of the endpoint layer.
/// </summary>
public sealed class DeviationEndpointRouteTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private const string RouteUnderTest = "/api/deviations";

    // ── Status code ───────────────────────────────────────────────────────

    /// <summary>
    /// The route must be registered and must not return 404 Not Found.
    /// A 200 OK response confirms the minimal API group is wired correctly.
    /// </summary>
    [Fact]
    public async Task GetDeviations_ReturnsSuccessStatusCode()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync(RouteUnderTest);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Content-type ──────────────────────────────────────────────────────

    /// <summary>
    /// The route must advertise <c>application/json</c> as its media type.
    /// A charset suffix (e.g. <c>; charset=utf-8</c>) is acceptable.
    /// </summary>
    [Fact]
    public async Task GetDeviations_ReturnsApplicationJson()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync(RouteUnderTest);

        response.Content.Headers.ContentType?.MediaType
            .Should().Be("application/json");
    }

    // ── Payload shape ─────────────────────────────────────────────────────

    /// <summary>
    /// The response body must carry an <c>items</c> property whose value is a
    /// JSON array (empty or populated).  This guards against the proxy
    /// regression where the route accidentally returned a non-array payload or
    /// was unreachable (404) so the frontend received no iterable data.
    /// </summary>
    [Fact]
    public async Task GetDeviations_ReturnsArrayPayload_WhenNoFilterIsProvided()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync(RouteUnderTest);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // The endpoint returns a PagedResult envelope; the array of deviation
        // summaries lives in the "items" property.
        root.TryGetProperty("items", out var items)
            .Should().BeTrue("the response envelope must contain an 'items' property");

        items.ValueKind
            .Should().Be(JsonValueKind.Array,
                "the 'items' value must be a JSON array so the frontend can iterate over results");
    }
}
