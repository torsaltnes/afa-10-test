using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using GreenfieldArchitecture.Api.Tests.Infrastructure;
using GreenfieldArchitecture.Application.Deviations.Contracts;
using GreenfieldArchitecture.Domain.Deviations;
using Xunit;

namespace GreenfieldArchitecture.Api.Tests.Deviations;

public sealed class DeviationEndpointsTests : IClassFixture<GreenfieldArchitectureApiFactory>
{
    // Must match server-side options: enums serialised as strings.
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly HttpClient _client;

    public DeviationEndpointsTests(GreenfieldArchitectureApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ── GET /api/deviations ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns200WithEmptyList()
    {
        var response = await _client.GetAsync("/api/deviations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<DeviationDto[]>(body, JsonOptions);
        list.Should().NotBeNull();
    }

    // ── POST /api/deviations ─────────────────────────────────────────────────

    [Fact]
    public async Task Post_ValidPayload_Returns201WithCreatedRecord()
    {
        var request = new CreateDeviationRequest(
            Title: "Loose seal on batch #42",
            Description: "The product seal was found loose on inspection.",
            Severity: DeviationSeverity.High,
            Status: DeviationStatus.Open,
            ReportedBy: "inspector-1");

        var response = await _client.PostAsJsonAsync("/api/deviations", request, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var body = await response.Content.ReadAsStringAsync();
        var dto = JsonSerializer.Deserialize<DeviationDto>(body, JsonOptions);

        dto.Should().NotBeNull();
        dto!.Id.Should().NotBe(Guid.Empty);
        dto.Title.Should().Be(request.Title);
        dto.Severity.Should().Be(DeviationSeverity.High);
    }

    [Fact]
    public async Task Post_BlankTitle_Returns400()
    {
        var request = new CreateDeviationRequest(
            Title: "",
            Description: "desc",
            Severity: DeviationSeverity.Low,
            Status: DeviationStatus.Open,
            ReportedBy: "user");

        var response = await _client.PostAsJsonAsync("/api/deviations", request, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── GET /api/deviations/{id} ─────────────────────────────────────────────

    [Fact]
    public async Task GetById_AfterCreate_Returns200WithRecord()
    {
        var created = await CreateDeviationAsync("Batch temp exceeded");

        var response = await _client.GetAsync($"/api/deviations/{created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var dto = JsonSerializer.Deserialize<DeviationDto>(body, JsonOptions);

        dto!.Id.Should().Be(created.Id);
        dto.Title.Should().Be("Batch temp exceeded");
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404()
    {
        var response = await _client.GetAsync($"/api/deviations/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── PUT /api/deviations/{id} ─────────────────────────────────────────────

    [Fact]
    public async Task Put_ValidPayload_Returns200WithUpdatedRecord()
    {
        var created = await CreateDeviationAsync("Original title");

        var updateRequest = new UpdateDeviationRequest(
            Title: "Updated title",
            Description: "Updated description",
            Severity: DeviationSeverity.Critical,
            Status: DeviationStatus.InProgress,
            ReportedBy: "updater");

        var response = await _client.PutAsJsonAsync($"/api/deviations/{created.Id}", updateRequest, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var dto = JsonSerializer.Deserialize<DeviationDto>(body, JsonOptions);

        dto!.Title.Should().Be("Updated title");
        dto.Status.Should().Be(DeviationStatus.InProgress);
        dto.Severity.Should().Be(DeviationSeverity.Critical);
    }

    [Fact]
    public async Task Put_UnknownId_Returns404()
    {
        var request = new UpdateDeviationRequest("t", "d", DeviationSeverity.Low, DeviationStatus.Open, "u");

        var response = await _client.PutAsJsonAsync($"/api/deviations/{Guid.NewGuid()}", request, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Put_BlankTitle_Returns400()
    {
        var created = await CreateDeviationAsync("Valid deviation");

        var request = new UpdateDeviationRequest("", "desc", DeviationSeverity.Low, DeviationStatus.Open, "user");

        var response = await _client.PutAsJsonAsync($"/api/deviations/{created.Id}", request, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── DELETE /api/deviations/{id} ──────────────────────────────────────────

    [Fact]
    public async Task Delete_ExistingRecord_Returns204()
    {
        var created = await CreateDeviationAsync("To be deleted");

        var response = await _client.DeleteAsync($"/api/deviations/{created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_UnknownId_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/deviations/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private async Task<DeviationDto> CreateDeviationAsync(string title)
    {
        var request = new CreateDeviationRequest(
            Title: title,
            Description: "Integration test deviation",
            Severity: DeviationSeverity.Medium,
            Status: DeviationStatus.Open,
            ReportedBy: "test-runner");

        var response = await _client.PostAsJsonAsync("/api/deviations", request, JsonOptions);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<DeviationDto>(body, JsonOptions)!;
    }
}
