using Greenfield.Application.Health;

namespace Greenfield.Application.Abstractions;

/// <summary>Produces a <see cref="HealthStatusDto"/> snapshot of the current service health.</summary>
public interface IHealthStatusService
{
    Task<HealthStatusDto> GetHealthStatusAsync(CancellationToken cancellationToken = default);
}
