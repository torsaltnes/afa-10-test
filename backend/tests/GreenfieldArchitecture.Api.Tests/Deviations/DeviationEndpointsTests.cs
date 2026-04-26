using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using GreenfieldArchitecture.Api.Tests.Infrastructure;
using GreenfieldArchitecture.Application.Deviations.Dtos;
using Xunit;

namespace GreenfieldArchitecture.Api.Tests.Deviations;

public sealed class DeviationEndpointsTests : IClassFixture<GreenfieldArchitectureApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly GreenfieldArchitectureApiFactory _factory;
    private readonly HttpClient _client;

    public DeviationEndpointsTests(GreenfieldArchitectureApiFactory factory)
    {
        _factory = factory;
        _factory.ResetDeviationRepository();
        _client = factory.CreateClient();
    }

    // ── GET /api/deviations ───────────────────────────────────────────────────

    [Fact]
    public async Task GetDeviations_Returns200AndEmptyArray()
    {
        var response = await _client.GetAsync("/api/deviations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var items = JsonSerializer.Deserialize<DeviationDto[]>(body, JsonOptions);
        items.Should().NotBeNull().And.BeEmpty();
    }

    // ── GET /api/deviations/{id} ──────────────────────────────────────────────

    [Fact]
    public async Task GetDeviationById_Returns404ForUnknownId()
    {
        var response = await _client.GetAsync($"/api/deviations/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── POST /api/deviations ──────────────────────────────────────────────────

    [Fact]
    public async Task PostDeviation_Returns201WithBodyAndLocationHeader()
    {
        var payload = new CreateDeviationRequest("Missing safety guard", "Guard removed from machine 12", "High");

        var response = await _client.PostAsJsonAsync("/api/deviations", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();

        var body = await response.Content.ReadAsStringAsync();
        var dto = JsonSerializer.Deserialize<DeviationDto>(body, JsonOptions);

        dto.Should().NotBeNull();
        dto!.Id.Should().NotBe(Guid.Empty);
        dto.Title.Should().Be("Missing safety guard");
        dto.Severity.Should().Be("High");
        dto.Status.Should().Be("Open");
    }

    [Fact]
    public async Task PostDeviation_Returns400ForInvalidSeverity()
    {
        var payload = new { title = "T", description = "D", severity = "UltraCritical" };

        var response = await _client.PostAsJsonAsync("/api/deviations", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostDeviation_Returns400ForBlankTitle()
    {
        var payload = new { title = "   ", description = "D", severity = "Low" };

        var response = await _client.PostAsJsonAsync("/api/deviations", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── PUT /api/deviations/{id} ──────────────────────────────────────────────

    [Fact]
    public async Task PutDeviation_UpdatesFieldsAndReturns200()
    {
        // Create first
        var created = await CreateDeviationAsync("Original title", "Original desc", "Low");

        var update = new UpdateDeviationRequest(created.Id, "Updated title", "Updated desc", "Critical", "Resolved");

        var response = await _client.PutAsJsonAsync($"/api/deviations/{created.Id}", update);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var dto = JsonSerializer.Deserialize<DeviationDto>(body, JsonOptions);

        dto!.Title.Should().Be("Updated title");
        dto.Severity.Should().Be("Critical");
        dto.Status.Should().Be("Resolved");
    }

    [Fact]
    public async Task PutDeviation_Returns400ForRoutBodyIdMismatch()
    {
        var created = await CreateDeviationAsync("Title", "Desc", "Low");

        // Body has a different ID than the route
        var mismatchedId = Guid.NewGuid();
        var update = new UpdateDeviationRequest(mismatchedId, "Title", "Desc", "Low", "Open");

        var response = await _client.PutAsJsonAsync($"/api/deviations/{created.Id}", update);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PutDeviation_Returns404ForUnknownId()
    {
        var unknownId = Guid.NewGuid();
        var update = new UpdateDeviationRequest(unknownId, "T", "D", "Low", "Open");

        var response = await _client.PutAsJsonAsync($"/api/deviations/{unknownId}", update);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── DELETE /api/deviations/{id} ───────────────────────────────────────────

    [Fact]
    public async Task DeleteDeviation_Returns204AndSubsequentGetReturns404()
    {
        var created = await CreateDeviationAsync("To delete", "Will be deleted", "Medium");

        var deleteResponse = await _client.DeleteAsync($"/api/deviations/{created.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await _client.GetAsync($"/api/deviations/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteDeviation_Returns404ForUnknownId()
    {
        var response = await _client.DeleteAsync($"/api/deviations/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Health endpoints still work ───────────────────────────────────────────

    [Fact]
    public async Task HealthEndpoint_StillRespondsWith200AfterDeviationRegistration()
    {
        var response = await _client.GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private async Task<DeviationDto> CreateDeviationAsync(string title, string description, string severity)
    {
        var payload = new CreateDeviationRequest(title, description, severity);
        var response = await _client.PostAsJsonAsync("/api/deviations", payload);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<DeviationDto>(body, JsonOptions)!;
    }
}
