using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Greenfield.Application.Deviations;
using Greenfield.Domain.Deviations;
using Greenfield.Infrastructure.Deviations;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.Routing;

/// <summary>
/// Route smoke tests — verifies every documented endpoint can be called with
/// valid parameters and does NOT return 404.  Asserts intended status codes,
/// not merely non-404, so routing failures are immediately distinguishable
/// from business-logic failures.
/// </summary>
public sealed class DocumentedEndpointStatusTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private HttpClient Client => factory.CreateClient();

    // ── Health ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetHealth_CanonicalRoute_Returns200()
    {
        var response = await Client.GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "/api/health is the canonical health route and must return 200");
    }

    [Fact]
    public async Task GetHealth_AliasRoute_Returns200()
    {
        var response = await Client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "/health is the backward-compatible alias and must also return 200");
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetDashboardSummary_Returns200()
    {
        var response = await Client.GetAsync("/api/dashboard/summary");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Deviations — collection ───────────────────────────────────────────

    [Fact]
    public async Task GetDeviations_CanonicalRoute_Returns200()
    {
        var response = await Client.GetAsync("/api/deviations");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "canonical /api/deviations (no trailing slash) must return 200");
    }

    [Fact]
    public async Task GetDeviationsExport_Returns200WithCsvContentType()
    {
        var response = await Client.GetAsync("/api/deviations/export");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/csv");
    }

    // ── Deviations — single item (uses well-known seed ID) ────────────────

    [Fact]
    public async Task GetDeviationById_SeedId_Returns200()
    {
        var response = await Client.GetAsync($"/api/deviations/{DeviationSeedData.Dev001Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "a known seeded deviation must be retrievable by ID");
    }

    [Fact]
    public async Task UpdateDeviation_ValidPayload_Returns200()
    {
        var request = new UpdateDeviationRequest(
            Title: "Smoke-test update",
            Description: "Updated by route smoke test",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            UpdatedBy: "smoketest@example.com");

        var response = await Client.PutAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev005Id}", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "PUT with a valid payload on a known ID must not return 404 or 400");
    }

    [Fact]
    public async Task TransitionDeviation_ValidTransition_ReturnsOkOrBadRequest()
    {
        // Dev006 is Registered → can go to UnderAssessment.
        // Even if it was already transitioned by another test, we check not-404.
        var request = new TransitionDeviationRequest(
            NewStatus: DeviationStatus.UnderAssessment,
            PerformedBy: "smoketest@example.com",
            Comment: "Route smoke test transition");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev006Id}/transition", request, JsonOpts);

        response.StatusCode.Should().NotBe(HttpStatusCode.NotFound,
            because: "transition endpoint for a known deviation ID must not return 404");

        // BeOneOf with explicit collection to avoid FluentAssertions 7 params/because conflict.
        var acceptable = new[] { HttpStatusCode.OK, HttpStatusCode.BadRequest };
        response.StatusCode.Should().BeOneOf(acceptable,
            because: "endpoint must respond with 200 (success) or 400 (invalid transition), never 404");
    }

    [Fact]
    public async Task GetDeviationTimeline_SeedId_Returns200()
    {
        var response = await Client.GetAsync(
            $"/api/deviations/{DeviationSeedData.Dev001Id}/timeline");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AddDeviationComment_ValidPayload_Returns201()
    {
        var request = new AddCommentRequest(
            "Route smoke test comment",
            "smoketest@example.com");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev002Id}/comments", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.Created,
            because: "adding a comment to a known deviation must succeed");
    }

    // ── Deviations — attachments ──────────────────────────────────────────

    [Fact]
    public async Task GetAttachments_SeedId_Returns200()
    {
        var response = await Client.GetAsync(
            $"/api/deviations/{DeviationSeedData.Dev001Id}/attachments");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UploadAndRemoveAttachment_NewDeviation_Returns201ThenNoContent()
    {
        // Create a new deviation so this test is self-contained.
        var create = await Client.PostAsJsonAsync("/api/deviations",
            new CreateDeviationRequest(
                "Attachment smoke test deviation",
                "Created by DocumentedEndpointStatusTests",
                DeviationSeverity.Low,
                DeviationCategory.Other,
                "smoketest@example.com"),
            JsonOpts);
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var dto = await create.Content.ReadFromJsonAsync<DeviationDto>(JsonOpts);

        // Upload
        var uploadRequest = new UploadAttachmentRequest(
            FileName: "smoke.txt",
            ContentType: "text/plain",
            Base64Content: Convert.ToBase64String("smoke test content"u8.ToArray()),
            UploadedBy: "smoketest@example.com");

        var upload = await Client.PostAsJsonAsync(
            $"/api/deviations/{dto!.Id}/attachments", uploadRequest, JsonOpts);
        upload.StatusCode.Should().Be(HttpStatusCode.Created);

        var attachment = await upload.Content.ReadFromJsonAsync<AttachmentDto>(JsonOpts);

        // Delete
        var delete = await Client.DeleteAsync(
            $"/api/deviations/{dto.Id}/attachments/{attachment!.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Teardown: delete the deviation
        await Client.DeleteAsync($"/api/deviations/{dto.Id}");
    }

    // ── OpenAPI infrastructure ────────────────────────────────────────────

    [Fact]
    public async Task GetOpenApiJson_Returns200()
    {
        var response = await Client.GetAsync("/openapi/v1.json");

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "/openapi/v1.json must be reachable in all environments");
    }

    [Fact]
    public async Task GetApiDocs_DoesNotReturn404()
    {
        var response = await Client.GetAsync("/api/docs");

        response.StatusCode.Should().NotBe(HttpStatusCode.NotFound,
            because: "/api/docs must not 404 in any environment");
    }
}
