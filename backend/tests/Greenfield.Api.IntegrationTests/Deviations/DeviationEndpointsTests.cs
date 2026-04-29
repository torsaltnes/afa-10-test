using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Greenfield.Application.Common;
using Greenfield.Application.Deviations;
using Greenfield.Domain.Deviations;
using Greenfield.Infrastructure.Deviations;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.Deviations;

/// <summary>
/// Integration tests for the <c>/api/deviations</c> endpoint group.
/// Uses <see cref="WebApplicationFactory{TEntryPoint}"/> for an in-process server
/// backed by the seeded in-memory repository.
/// </summary>
public sealed class DeviationEndpointsTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private HttpClient Client => factory.CreateClient();

    // ── GET /api/deviations ───────────────────────────────────────────────

    [Fact]
    public async Task GetDeviations_ReturnsOk_WithPagedResult()
    {
        var response = await Client.GetAsync("/api/deviations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("items",      out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("totalCount", out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("page",       out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("pageSize",   out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetDeviations_SeedDataIncluded_TotalCountAtLeastSix()
    {
        var response = await Client.GetAsync("/api/deviations?pageSize=100");

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        doc.RootElement.GetProperty("totalCount").GetInt32().Should().BeGreaterThanOrEqualTo(6);
    }

    [Fact]
    public async Task GetDeviations_WithStatusFilter_ReturnsOnlyMatchingDeviations()
    {
        var response = await Client.GetAsync("/api/deviations?status=Registered");

        var body = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PagedResult<DeviationSummaryDto>>(body, JsonOpts)!;

        result.Items.Should().AllSatisfy(d => d.Status.Should().Be(DeviationStatus.Registered));
    }

    [Fact]
    public async Task GetDeviations_Pagination_ReturnsCorrectPageSize()
    {
        var response = await Client.GetAsync("/api/deviations?page=1&pageSize=2");

        var body = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<PagedResult<DeviationSummaryDto>>(body, JsonOpts)!;

        result.Items.Should().HaveCount(2);
        result.PageSize.Should().Be(2);
    }

    // ── GET /api/deviations/{id} ──────────────────────────────────────────

    [Fact]
    public async Task GetDeviationById_SeedId_ReturnsOk_WithFullDto()
    {
        var response = await Client.GetAsync($"/api/deviations/{DeviationSeedData.Dev001Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        doc.RootElement.GetProperty("id").GetString()
            .Should().Be(DeviationSeedData.Dev001Id.ToString());
        doc.RootElement.TryGetProperty("timeline",    out _).Should().BeTrue();
        doc.RootElement.TryGetProperty("attachments", out _).Should().BeTrue();
    }

    [Fact]
    public async Task GetDeviationById_UnknownId_ReturnsNotFound()
    {
        var response = await Client.GetAsync($"/api/deviations/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── POST /api/deviations ──────────────────────────────────────────────

    [Fact]
    public async Task CreateDeviation_ValidRequest_ReturnsCreated_WithLocation()
    {
        var request = new CreateDeviationRequest(
            Title: "Integration test deviation",
            Description: "Created from integration test",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            ReportedBy: "integrationtest@example.com");

        var response = await Client.PostAsJsonAsync("/api/deviations", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var dto = await response.Content.ReadFromJsonAsync<DeviationDto>(JsonOpts);
        dto!.Title.Should().Be("Integration test deviation");
        dto.Status.Should().Be(DeviationStatus.Registered);
    }

    [Fact]
    public async Task CreateDeviation_EmptyTitle_ReturnsBadRequest()
    {
        var request = new CreateDeviationRequest(
            Title: "   ",
            Description: "desc",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            ReportedBy: "user@example.com");

        var response = await Client.PostAsJsonAsync("/api/deviations", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── PUT /api/deviations/{id} ──────────────────────────────────────────

    [Fact]
    public async Task UpdateDeviation_ValidRequest_ReturnsOk_WithUpdatedFields()
    {
        var request = new UpdateDeviationRequest(
            Title: "Updated title",
            Description: "Updated description",
            Severity: DeviationSeverity.High,
            Category: DeviationCategory.Safety,
            UpdatedBy: "updater@example.com");

        var response = await Client.PutAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev005Id}", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await response.Content.ReadFromJsonAsync<DeviationDto>(JsonOpts);
        dto!.Title.Should().Be("Updated title");
        dto.Severity.Should().Be(DeviationSeverity.High);
    }

    [Fact]
    public async Task UpdateDeviation_UnknownId_ReturnsNotFound()
    {
        var request = new UpdateDeviationRequest(
            Title: "T",
            Description: "D",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other);

        var response = await Client.PutAsJsonAsync(
            $"/api/deviations/{Guid.NewGuid()}", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── DELETE /api/deviations/{id} ───────────────────────────────────────

    [Fact]
    public async Task DeleteDeviation_ExistingId_ReturnsNoContent()
    {
        // Create then delete so we don't disturb seed data used by other tests.
        var create = await Client.PostAsJsonAsync("/api/deviations",
            new CreateDeviationRequest("To delete", "desc", DeviationSeverity.Low,
                DeviationCategory.Other, "user@example.com"), JsonOpts);
        var dto = await create.Content.ReadFromJsonAsync<DeviationDto>(JsonOpts);

        var response = await Client.DeleteAsync($"/api/deviations/{dto!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteDeviation_UnknownId_ReturnsNotFound()
    {
        var response = await Client.DeleteAsync($"/api/deviations/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── POST /api/deviations/{id}/transition ──────────────────────────────

    [Fact]
    public async Task TransitionDeviation_ValidTransition_ReturnsOk_WithNewStatus()
    {
        var request = new TransitionDeviationRequest(
            NewStatus: DeviationStatus.UnderAssessment,
            PerformedBy: "supervisor@example.com",
            Comment: "Escalating for assessment");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev006Id}/transition", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await response.Content.ReadFromJsonAsync<DeviationDto>(JsonOpts);
        dto!.Status.Should().Be(DeviationStatus.UnderAssessment);
    }

    [Fact]
    public async Task TransitionDeviation_InvalidTransition_ReturnsBadRequest()
    {
        // DEV-001 is Closed; cannot go directly to UnderAssessment.
        var request = new TransitionDeviationRequest(
            NewStatus: DeviationStatus.UnderAssessment,
            PerformedBy: "user@example.com");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev001Id}/transition", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task TransitionDeviation_UnknownId_ReturnsNotFound()
    {
        var request = new TransitionDeviationRequest(
            NewStatus: DeviationStatus.UnderAssessment,
            PerformedBy: "user@example.com");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{Guid.NewGuid()}/transition", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GET /api/deviations/{id}/timeline ─────────────────────────────────

    [Fact]
    public async Task GetTimeline_SeedDeviation_ReturnsOk_WithActivities()
    {
        var response = await Client.GetAsync(
            $"/api/deviations/{DeviationSeedData.Dev001Id}/timeline");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        doc.RootElement.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetTimeline_UnknownId_ReturnsNotFound()
    {
        var response = await Client.GetAsync(
            $"/api/deviations/{Guid.NewGuid()}/timeline");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── POST /api/deviations/{id}/comments ───────────────────────────────

    [Fact]
    public async Task AddComment_ValidRequest_ReturnsCreated_WithActivity()
    {
        var request = new AddCommentRequest(
            "This is a comment from integration test.",
            "commenter@example.com");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev004Id}/comments", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var activity = await response.Content.ReadFromJsonAsync<ActivityDto>(JsonOpts);
        activity!.Type.Should().Be(ActivityType.CommentAdded);
        activity.Description.Should().Be("This is a comment from integration test.");
    }

    [Fact]
    public async Task AddComment_UnknownId_ReturnsNotFound()
    {
        var request = new AddCommentRequest("comment", "user@example.com");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{Guid.NewGuid()}/comments", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GET /api/deviations/{id}/attachments ──────────────────────────────

    [Fact]
    public async Task GetAttachments_SeedDeviationWithAttachments_ReturnsOk_WithList()
    {
        var response = await Client.GetAsync(
            $"/api/deviations/{DeviationSeedData.Dev001Id}/attachments");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        doc.RootElement.GetArrayLength().Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task GetAttachments_UnknownId_ReturnsNotFound()
    {
        var response = await Client.GetAsync(
            $"/api/deviations/{Guid.NewGuid()}/attachments");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── POST /api/deviations/{id}/attachments ─────────────────────────────

    [Fact]
    public async Task UploadAttachment_ValidBase64_ReturnsCreated()
    {
        var content = Convert.ToBase64String("Hello, attachment!"u8.ToArray());
        var request = new UploadAttachmentRequest(
            FileName: "test.txt",
            ContentType: "text/plain",
            Base64Content: content,
            UploadedBy: "tester@example.com");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev005Id}/attachments", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var dto = await response.Content.ReadFromJsonAsync<AttachmentDto>(JsonOpts);
        dto!.FileName.Should().Be("test.txt");
        dto.ContentType.Should().Be("text/plain");
    }

    // ── DELETE /api/deviations/{id}/attachments/{attachmentId} ───────────

    [Fact]
    public async Task RemoveAttachment_UnknownAttachmentId_ReturnsNotFound()
    {
        var response = await Client.DeleteAsync(
            $"/api/deviations/{DeviationSeedData.Dev001Id}/attachments/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GET /api/deviations/export ────────────────────────────────────────

    [Fact]
    public async Task ExportCsv_ReturnsOk_WithCsvContentType()
    {
        var response = await Client.GetAsync("/api/deviations/export");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/csv");
    }

    [Fact]
    public async Task ExportCsv_ContainsHeaderRow()
    {
        var response = await Client.GetAsync("/api/deviations/export");
        var body = await response.Content.ReadAsStringAsync();

        body.Should().StartWith("Id,Title,Status,Severity,Category,ReportedBy");
    }

    // ── Security: CSV formula-injection neutralization ────────────────────

    [Fact]
    public async Task ExportCsv_FormulaInjectionInTitle_IsPrefixedWithSingleQuote()
    {
        // Arrange: create a deviation whose title starts with '=' (formula injection attempt).
        var injectionTitle = "=HYPERLINK(\"https://evil.example.com\",\"Click\")";
        var createRequest = new CreateDeviationRequest(
            Title: injectionTitle,
            Description: "Security test",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            ReportedBy: "+AttackerReportedBy");

        var createResponse = await Client.PostAsJsonAsync("/api/deviations", createRequest, JsonOpts);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Act: export all deviations to CSV.
        var exportResponse = await Client.GetAsync("/api/deviations/export");
        exportResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var csv = await exportResponse.Content.ReadAsStringAsync();

        // Assert: the exported CSV must neutralize the formula by prepending a single quote.
        // The title starts with '= → neutralized to '= → then RFC4180-quoted because it contains commas/quotes.
        csv.Should().Contain("'=HYPERLINK",
            because: "formula-starting values must be neutralized with a leading single-quote");

        // The ReportedBy field starts with '+' and must also be neutralized.
        csv.Should().Contain("'+AttackerReportedBy",
            because: "values starting with '+' must be neutralized with a leading single-quote");
    }

    [Theory]
    [InlineData("=SUM(A1:A10)")]
    [InlineData("+cmd|' /C calc'!A0")]
    [InlineData("-2+3")]
    [InlineData("@SUM(1+1)")]
    public async Task ExportCsv_AllFormulaInjectionPrefixes_AreNeutralized(string attackerValue)
    {
        // Arrange: create a deviation with an attacker-controlled title.
        var createRequest = new CreateDeviationRequest(
            Title: attackerValue,
            Description: "Formula injection test",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            ReportedBy: "security-test@example.com");

        var createResponse = await Client.PostAsJsonAsync("/api/deviations", createRequest, JsonOpts);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<DeviationDto>(JsonOpts);

        // Act: export.
        var csv = await (await Client.GetAsync("/api/deviations/export")).Content.ReadAsStringAsync();

        // Assert: the neutralized value appears in the CSV (with leading quote).
        csv.Should().Contain($"'{attackerValue}",
            because: $"values starting with '{attackerValue[0]}' must be prefixed with a single-quote");

        // Clean up the created deviation so it doesn't affect other tests.
        await Client.DeleteAsync($"/api/deviations/{created!.Id}");
    }

    // ── Security: attachment upload size limits ────────────────────────────

    [Fact]
    public async Task UploadAttachment_OversizedPayload_ReturnsBadRequest()
    {
        // Arrange: create base64 content that decodes to more than 5 MiB.
        // 6 MiB of zeros encodes to ~8 MiB of base64, well above the limit.
        var oversizedBytes = new byte[6 * 1024 * 1024]; // 6 MiB, all zeros
        var base64 = Convert.ToBase64String(oversizedBytes);

        var request = new UploadAttachmentRequest(
            FileName: "oversized.bin",
            ContentType: "application/octet-stream",
            Base64Content: base64,
            UploadedBy: "tester@example.com");

        // Act
        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev005Id}/attachments", request, JsonOpts);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            because: "attachments that exceed the 5 MiB limit must be rejected with 400");
    }

    [Fact]
    public async Task UploadAttachment_ExactlyAtSizeLimit_IsAccepted()
    {
        // Arrange: exactly 5 MiB decoded (== limit, should be accepted).
        var exactBytes = new byte[5 * 1024 * 1024]; // exactly 5 MiB
        var base64 = Convert.ToBase64String(exactBytes);

        var request = new UploadAttachmentRequest(
            FileName: "exact-limit.bin",
            ContentType: "application/octet-stream",
            Base64Content: base64,
            UploadedBy: "tester@example.com");

        // Act
        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev002Id}/attachments", request, JsonOpts);

        // Assert: exactly at the limit must be accepted (not rejected).
        response.StatusCode.Should().Be(HttpStatusCode.Created,
            because: "an attachment whose decoded size equals the limit exactly should be accepted");
    }

    // ── Security: invalid base64 ───────────────────────────────────────────

    [Fact]
    public async Task UploadAttachment_InvalidBase64_ReturnsBadRequest()
    {
        var request = new UploadAttachmentRequest(
            FileName: "bad.txt",
            ContentType: "text/plain",
            Base64Content: "this-is-not-valid-base64!!!",
            UploadedBy: "tester@example.com");

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev005Id}/attachments", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            because: "invalid base64 content must be rejected with 400");
    }

    // ── Security: trust-boundary validation (UpdatedBy / UploadedBy) ──────

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateDeviation_BlankUpdatedBy_ReturnsBadRequest(string updatedBy)
    {
        var request = new UpdateDeviationRequest(
            Title: "Valid title",
            Description: "Valid description",
            Severity: DeviationSeverity.Low,
            Category: DeviationCategory.Other,
            UpdatedBy: updatedBy);

        var response = await Client.PutAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev005Id}", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            because: "a blank UpdatedBy must be rejected at the service boundary with 400");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UploadAttachment_BlankUploadedBy_ReturnsBadRequest(string uploadedBy)
    {
        var content = Convert.ToBase64String("test content"u8.ToArray());
        var request = new UploadAttachmentRequest(
            FileName: "test.txt",
            ContentType: "text/plain",
            Base64Content: content,
            UploadedBy: uploadedBy);

        var response = await Client.PostAsJsonAsync(
            $"/api/deviations/{DeviationSeedData.Dev005Id}/attachments", request, JsonOpts);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            because: "a blank UploadedBy must be rejected at the service boundary with 400");
    }
}
