using GreenfieldArchitecture.Application.Abstractions.Health;
using GreenfieldArchitecture.Application.Health.Queries;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GreenfieldArchitecture.Api.Endpoints;

/// <summary>
/// Minimal API endpoints for the health domain slice.
/// </summary>
public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/health").WithTags("Health");

        group.MapGet("/", GetHealthAsync)
            .WithName("GetHealthStatus")
            .WithSummary("Returns the current health status of the service.")
            .Produces<GreenfieldArchitecture.Application.Health.Dtos.HealthStatusDto>(StatusCodes.Status200OK);

        return routes;
    }

    private static async Task<Ok<GreenfieldArchitecture.Application.Health.Dtos.HealthStatusDto>> GetHealthAsync(
        IHealthService healthService,
        CancellationToken cancellationToken)
    {
        var dto = await healthService.GetAsync(new GetHealthStatusQuery(), cancellationToken)
            .ConfigureAwait(false);

        return TypedResults.Ok(dto);
    }
}
