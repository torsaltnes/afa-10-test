using System.Net;
using System.Text;
using FluentAssertions;
using GreenfieldArchitecture.Api.Tests.Infrastructure;
using Xunit;

namespace GreenfieldArchitecture.Api.Tests.Deviations;

/// <summary>
/// Verifies that deviation mutation endpoints enforce authentication and return
/// <c>401 Unauthorized</c> when called without credentials.
/// Read-only endpoints are expected to remain publicly accessible.
/// </summary>
public sealed class DeviationEndpointsAuthorizationTests : IClassFixture<GreenfieldArchitectureApiFactory>
{
    private readonly GreenfieldArchitectureApiFactory _factory;

    public DeviationEndpointsAuthorizationTests(GreenfieldArchitectureApiFactory factory)
    {
        _factory = factory;
    }

    // ── Mutation endpoints must reject unauthenticated callers ────────────────

    [Fact]
    public async Task PostDeviation_Returns401ForUnauthenticatedRequest()
    {
        using var client = _factory.CreateUnauthenticatedClient();

        var payload = """{"title":"T","description":"D","severity":"Low"}""";
        using var content = new StringContent(payload, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/api/deviations", content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PutDeviation_Returns401ForUnauthenticatedRequest()
    {
        var id = Guid.NewGuid();
        using var client = _factory.CreateUnauthenticatedClient();

        var payload = $$"""{"id":"{{id}}","title":"T","description":"D","severity":"Low","status":"Open"}""";
        using var content = new StringContent(payload, Encoding.UTF8, "application/json");

        var response = await client.PutAsync($"/api/deviations/{id}", content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteDeviation_Returns401ForUnauthenticatedRequest()
    {
        using var client = _factory.CreateUnauthenticatedClient();

        var response = await client.DeleteAsync($"/api/deviations/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Read-only endpoints remain accessible without credentials ─────────────

    [Fact]
    public async Task GetDeviations_Returns200ForUnauthenticatedRequest()
    {
        using var client = _factory.CreateUnauthenticatedClient();

        var response = await client.GetAsync("/api/deviations");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetDeviationById_Returns404ForUnauthenticatedRequestWithUnknownId()
    {
        using var client = _factory.CreateUnauthenticatedClient();

        var response = await client.GetAsync($"/api/deviations/{Guid.NewGuid()}");

        // 404 confirms the endpoint ran — no redirect or 401 was returned.
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
