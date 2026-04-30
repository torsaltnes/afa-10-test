using Scalar.AspNetCore;

namespace Greenfield.Api.Endpoints;

/// <summary>
/// Registers all infrastructure-level OpenAPI documentation endpoints.
/// Exposes the raw JSON document at a stable URL and a browser UI via redirect.
/// No business models live in this file.
/// </summary>
public static class OpenApiEndpoints
{
    /// <summary>
    /// Scalar's own UI route for the "v1" named document.
    /// Matches the default path that <see cref="ScalarEndpointRouteBuilderExtensions.MapScalarApiReference"/>
    /// registers when the document is named <c>v1</c>.
    /// </summary>
    private const string ScalarUiRoute = "/scalar/v1";

    public static IEndpointRouteBuilder MapOpenApiEndpoints(this IEndpointRouteBuilder app)
    {
        // ── OpenAPI JSON document ─────────────────────────────────────────
        // Stable, deterministic path: /openapi/v1.json
        app.MapOpenApi("/openapi/{documentName}.json");

        // ── Scalar browser UI ─────────────────────────────────────────────
        // Point Scalar at the same stable JSON route so the UI always
        // loads the correct document regardless of environment.
        app.MapScalarApiReference(options =>
        {
            options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
        });

        // ── /api/docs redirect ────────────────────────────────────────────
        // Operator decision: /api/docs is a lightweight redirect to the
        // Scalar helper UI route.  Excluded from generated schema so it
        // does not appear as a documented business operation.
        app.MapGet("/api/docs", () => Results.Redirect(ScalarUiRoute))
           .ExcludeFromDescription();

        return app;
    }
}
