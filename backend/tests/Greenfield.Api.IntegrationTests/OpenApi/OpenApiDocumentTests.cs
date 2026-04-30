using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.OpenApi;

/// <summary>
/// Integration tests for the generated OpenAPI document served at
/// <c>GET /openapi/v1.json</c>.
/// </summary>
public sealed class OpenApiDocumentTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    // ── Availability ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetOpenApiDocument_ReturnsOkAndJson()
    {
        var response = await _client.GetAsync("/openapi/v1.json");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "the OpenAPI JSON endpoint must be reachable in all environments");
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json",
            because: "the document must be served as JSON");
    }

    // ── Info fields ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetOpenApiDocument_ContainsExpectedInfoFields()
    {
        var response = await _client.GetAsync("/openapi/v1.json");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json = await response.Content.ReadAsStringAsync();
        var doc  = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("openapi").GetString()
            .Should().StartWith("3.",
                because: "the document must conform to OpenAPI 3.x");

        var info = doc.RootElement.GetProperty("info");
        info.GetProperty("title").GetString()
            .Should().Be("Greenfield.Api",
                because: "title must come from AppSettings:ServiceName");
        info.GetProperty("version").GetString()
            .Should().Be("1.0.0",
                because: "version must come from AppSettings:Version");
    }

    // ── Path coverage ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetOpenApiDocument_ContainsDocumentedRoutes()
    {
        var response = await _client.GetAsync("/openapi/v1.json");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json  = await response.Content.ReadAsStringAsync();
        var doc   = JsonDocument.Parse(json);
        var paths = doc.RootElement.GetProperty("paths");

        // Health
        paths.TryGetProperty("/api/health", out _).Should().BeTrue(
            because: "canonical health route must appear in the document");

        // Dashboard
        paths.TryGetProperty("/api/dashboard/summary", out _).Should().BeTrue(
            because: "dashboard summary route must appear in the document");

        // Deviations — collection (no trailing slash)
        paths.TryGetProperty("/api/deviations", out _).Should().BeTrue(
            because: "canonical deviation collection route must appear in the document");

        // Deviations — export
        paths.TryGetProperty("/api/deviations/export", out _).Should().BeTrue(
            because: "export route must appear before the {id} capture segment");

        // Deviations — single item
        paths.TryGetProperty("/api/deviations/{id}", out _).Should().BeTrue(
            because: "deviation by-ID route must appear in the document");

        // Deviations — sub-resources
        paths.TryGetProperty("/api/deviations/{id}/timeline", out _).Should().BeTrue();
        paths.TryGetProperty("/api/deviations/{id}/comments", out _).Should().BeTrue();
        paths.TryGetProperty("/api/deviations/{id}/attachments", out _).Should().BeTrue();
        paths.TryGetProperty("/api/deviations/{id}/attachments/{attachmentId}", out _).Should().BeTrue();
        paths.TryGetProperty("/api/deviations/{id}/transition", out _).Should().BeTrue();
    }

    // ── Operation metadata ────────────────────────────────────────────────

    [Fact]
    public async Task GetOpenApiDocument_ContainsExpectedOperationsAndResponses()
    {
        var response = await _client.GetAsync("/openapi/v1.json");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var json  = await response.Content.ReadAsStringAsync();
        var doc   = JsonDocument.Parse(json);
        var paths = doc.RootElement.GetProperty("paths");

        // ── Health ─────────────────────────────────────────────────────
        var healthGet = paths.GetProperty("/api/health").GetProperty("get");
        healthGet.GetProperty("operationId").GetString().Should().Be("GetHealth");
        healthGet.GetProperty("tags")[0].GetString().Should().Be("Health");
        var healthResponses = healthGet.GetProperty("responses");
        healthResponses.TryGetProperty("200", out _).Should().BeTrue();
        healthResponses.TryGetProperty("503", out _).Should().BeTrue();

        // ── Dashboard ──────────────────────────────────────────────────
        var summaryGet = paths.GetProperty("/api/dashboard/summary").GetProperty("get");
        summaryGet.GetProperty("operationId").GetString().Should().Be("GetDashboardSummary");
        summaryGet.GetProperty("tags")[0].GetString().Should().Be("Dashboard");
        summaryGet.GetProperty("responses").TryGetProperty("200", out _).Should().BeTrue();

        // ── Deviation list ─────────────────────────────────────────────
        var deviationsGet = paths.GetProperty("/api/deviations").GetProperty("get");
        deviationsGet.GetProperty("operationId").GetString().Should().Be("GetDeviations");
        deviationsGet.GetProperty("tags")[0].GetString().Should().Be("Deviations");
        deviationsGet.GetProperty("responses").TryGetProperty("200", out _).Should().BeTrue();

        // ── Deviation create ───────────────────────────────────────────
        var deviationsPost = paths.GetProperty("/api/deviations").GetProperty("post");
        deviationsPost.GetProperty("operationId").GetString().Should().Be("CreateDeviation");
        var createResponses = deviationsPost.GetProperty("responses");
        createResponses.TryGetProperty("201", out _).Should().BeTrue();
        createResponses.TryGetProperty("400", out _).Should().BeTrue();

        // ── Deviation by-ID ────────────────────────────────────────────
        var deviationByIdGet = paths.GetProperty("/api/deviations/{id}").GetProperty("get");
        deviationByIdGet.GetProperty("operationId").GetString().Should().Be("GetDeviationById");
        var byIdResponses = deviationByIdGet.GetProperty("responses");
        byIdResponses.TryGetProperty("200", out _).Should().BeTrue();
        byIdResponses.TryGetProperty("404", out _).Should().BeTrue();

        // ── Export ─────────────────────────────────────────────────────
        var exportGet = paths.GetProperty("/api/deviations/export").GetProperty("get");
        exportGet.GetProperty("operationId").GetString().Should().Be("ExportDeviationsCsv");
        exportGet.GetProperty("responses").TryGetProperty("200", out _).Should().BeTrue();
    }
}
