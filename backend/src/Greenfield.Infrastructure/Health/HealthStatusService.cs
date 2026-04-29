using Greenfield.Application.Abstractions;
using Greenfield.Application.Health;
using Greenfield.Domain.Health;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Greenfield.Infrastructure.Health;

/// <summary>
/// Resolves the current health state by delegating to the registered
/// <see cref="HealthCheckService"/> and enriches the result with
/// runtime metadata sourced from configuration and the host environment.
/// </summary>
public sealed class HealthStatusService(
    HealthCheckService healthCheckService,
    IWebHostEnvironment environment,
    IConfiguration configuration) : IHealthStatusService
{
    public async Task<HealthStatusDto> GetHealthStatusAsync(CancellationToken cancellationToken = default)
    {
        var report = await healthCheckService
            .CheckHealthAsync(cancellationToken)
            .ConfigureAwait(false);

        var state = report.Status switch
        {
            HealthStatus.Healthy  => HealthState.Healthy,
            HealthStatus.Degraded => HealthState.Degraded,
            _                     => HealthState.Unhealthy,
        };

        return new HealthStatusDto(
            Status:       state,
            ServiceName:  configuration["AppSettings:ServiceName"] ?? "Greenfield.Api",
            Environment:  environment.EnvironmentName,
            Version:      configuration["AppSettings:Version"] ?? "1.0.0",
            TimestampUtc: DateTimeOffset.UtcNow);
    }
}
