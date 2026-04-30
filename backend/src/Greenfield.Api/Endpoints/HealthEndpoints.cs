using Greenfield.Application.Abstractions;
using Greenfield.Application.Health;
using Greenfield.Domain.Health;

namespace Greenfield.Api.Endpoints;

/// <summary>Registers health-check endpoints.</summary>
/// <remarks>
/// Routing audit note: the original <c>/health</c> route sat outside the
/// <c>/api/*</c> namespace used by all other endpoints, causing 404s for
/// callers that assumed the canonical <c>/api/health</c> path.  Both routes
/// are now registered; <c>/api/health</c> is canonical and <c>/health</c>
/// is kept as a backward-compatible alias.
/// </remarks>
public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Canonical route ────────────────────────────────────────────────
        app.MapGet("/api/health", HandleHealthCheck)
           .WithName("GetHealth")
           .WithSummary("Get service health status")
           .WithDescription(
               "Returns the current health state of the service together with runtime " +
               "metadata such as service name, version, environment, and timestamp. " +
               "Responds with 200 OK when the service is Healthy or Degraded, " +
               "and 503 Service Unavailable when Unhealthy.")
           .Produces<HealthStatusDto>(StatusCodes.Status200OK)
           .Produces<HealthStatusDto>(StatusCodes.Status503ServiceUnavailable)
           .WithTags("Health");

        // ── Backward-compatible alias ─────────────────────────────────────
        // Retained so existing integrations that call /health continue to work.
        app.MapGet("/health", HandleHealthCheck)
           .WithName("GetHealth_Alias")
           .WithSummary("Get service health status (alias)")
           .WithDescription("Backward-compatible alias for /api/health.")
           .Produces<HealthStatusDto>(StatusCodes.Status200OK)
           .Produces<HealthStatusDto>(StatusCodes.Status503ServiceUnavailable)
           .WithTags("Health");

        return app;
    }

    // ── Handler ───────────────────────────────────────────────────────────

    private static async Task<IResult> HandleHealthCheck(
        IHealthStatusService service,
        CancellationToken ct)
    {
        var dto = await service.GetHealthStatusAsync(ct);

        return dto.Status == HealthState.Unhealthy
            ? Results.Json(dto, statusCode: StatusCodes.Status503ServiceUnavailable)
            : Results.Ok(dto);
    }
}
