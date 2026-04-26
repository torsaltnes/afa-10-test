using Greenfield.Application.Health;

namespace Greenfield.Application.Abstractions.Health;

public interface IHealthCheckService
{
    Task<HealthCheckResult> GetCurrentAsync(CancellationToken cancellationToken);
}
