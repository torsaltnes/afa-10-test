using GreenfieldArchitecture.Application.Health.Dtos;
using GreenfieldArchitecture.Application.Health.Queries;

namespace GreenfieldArchitecture.Application.Abstractions.Health;

/// <summary>
/// Application-level contract for querying health status.
/// </summary>
public interface IHealthService
{
    Task<HealthStatusDto> GetAsync(
        GetHealthStatusQuery query,
        CancellationToken cancellationToken = default);
}
