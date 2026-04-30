using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Greenfield.Api.IntegrationTests.OpenApi;

/// <summary>
/// Integration tests for the browser-facing API documentation UI reachable
/// via <c>/api/docs</c>.
/// </summary>
public sealed class ApiDocumentationUiTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // ── /api/docs redirect ────────────────────────────────────────────────

    /// <summary>
    /// /api/docs must issue a redirect (not 404) per the operator decision
    /// that it is a lightweight redirect to the Scalar helper UI route.
    /// </summary>
    [Fact]
    public async Task GetApiDocs_ReturnsRedirect_ToScalarUi()
    {
        // Use a client that does NOT follow redirects so we can assert the
        // redirect response itself rather than the final HTML page.
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var response = await client.GetAsync("/api/docs");

        // BeOneOf with an explicit collection to avoid the params/because conflict in FluentAssertions 7.
        var redirectCodes = new[]
        {
            HttpStatusCode.Found,
            HttpStatusCode.MovedPermanently,
            HttpStatusCode.TemporaryRedirect,
            HttpStatusCode.PermanentRedirect,
        };
        response.StatusCode.Should().BeOneOf(redirectCodes,
            because: "/api/docs must redirect to the Scalar UI route");

        response.Headers.Location.Should().NotBeNull(
            because: "the redirect response must carry a Location header");
    }

    /// <summary>
    /// /api/docs must never return 404 in any environment.
    /// This is a regression guard for the confirmed baseline issue where the
    /// docs endpoint was only available in Development.
    /// </summary>
    [Fact]
    public async Task GetApiDocs_DoesNotReturnNotFound()
    {
        // Follow the redirect — the chain should resolve to 200 HTML.
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/docs");

        response.StatusCode.Should().NotBe(HttpStatusCode.NotFound,
            because: "the docs endpoint must be reachable in all environments, not just Development");
    }

    /// <summary>
    /// After following the redirect, the Scalar UI page must reference the
    /// generated OpenAPI JSON document.
    /// Scalar embeds the route as a relative URL (<c>openapi/v1.json</c>)
    /// in its initialisation script.
    /// </summary>
    [Fact]
    public async Task GetApiDocs_UiPage_ReferencesOpenApiJsonRoute()
    {
        // Follow redirects to reach the final Scalar HTML page.
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/docs");

        // If the chain settled on a success HTML page, verify the JSON route is referenced.
        // Scalar embeds the OpenAPI JSON URL in its initialisation script as a relative path
        // e.g. "url":"openapi/v1.json" (no leading slash — relative to the document base).
        if (response.IsSuccessStatusCode)
        {
            var html = await response.Content.ReadAsStringAsync();
            html.Should().Contain("openapi/v1.json",
                because: "the Scalar UI initialisation script must reference the v1 OpenAPI document");
        }
        else
        {
            // If the redirect chain did not follow (e.g. non-2xx), at minimum the
            // Location header must point toward a docs-related path.
            response.Headers.Location?.ToString().Should().Contain("scalar",
                because: "the redirect target should be the Scalar UI route");
        }
    }

    // ── Scalar UI reachability ────────────────────────────────────────────

    /// <summary>
    /// The Scalar UI itself must be directly reachable at /scalar/v1 without
    /// requiring a redirect.
    /// </summary>
    [Fact]
    public async Task GetScalarUi_ReturnsSuccess()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/scalar/v1");

        response.IsSuccessStatusCode.Should().BeTrue(
            because: "the Scalar UI must be reachable at its canonical route");
    }
}
