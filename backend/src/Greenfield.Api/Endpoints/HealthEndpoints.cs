using Greenfield.Application.Abstractions;
using Greenfield.Domain.Health;

namespace Greenfield.Api.Endpoints;

/// <summary>Registers the <c>GET /health</c> endpoint group.</summary>
public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", async (IHealthStatusService service, CancellationToken ct) =>
        {
            var dto = await service.GetHealthStatusAsync(ct);

            return dto.Status == HealthState.Unhealthy
                ? Results.Json(dto, statusCode: StatusCodes.Status503ServiceUnavailable)
                : Results.Ok(dto);
        })
        .WithName("GetHealth")
        .WithTags("Health");

        return app;
    }
}
