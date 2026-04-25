using Greenfield.Application.Abstractions.Health;
using Greenfield.Application.Health;
using Microsoft.Extensions.Hosting;

namespace Greenfield.Infrastructure.Services;

public class SystemHealthCheckService(TimeProvider timeProvider, IHostEnvironment hostEnvironment)
    : IHealthCheckService
{
    public Task<HealthCheckResult> GetCurrentAsync(CancellationToken cancellationToken)
    {
        var result = new HealthCheckResult(
            Status: "Healthy",
            ApplicationName: hostEnvironment.ApplicationName,
            Environment: hostEnvironment.EnvironmentName,
            CheckedAtUtc: timeProvider.GetUtcNow());

        return Task.FromResult(result);
    }
}
