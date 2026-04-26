using GreenfieldArchitecture.Application.Abstractions.Health;
using GreenfieldArchitecture.Application.Health.Dtos;
using GreenfieldArchitecture.Application.Health.Queries;
using GreenfieldArchitecture.Domain.Health;

namespace GreenfieldArchitecture.Application.Health.Services;

/// <summary>
/// Orchestrates the health check by reading metadata, building a domain snapshot,
/// and mapping it to the HTTP contract DTO.
/// </summary>
public sealed class HealthService(
    IApplicationMetadataProvider metadataProvider,
    TimeProvider timeProvider) : IHealthService
{
    public Task<HealthStatusDto> GetAsync(
        GetHealthStatusQuery query,
        CancellationToken cancellationToken = default)
    {
        var metadata = metadataProvider.GetMetadata();

        var snapshot = new HealthSnapshot(
            Status: HealthState.Healthy,
            Metadata: metadata,
            CheckedAtUtc: timeProvider.GetUtcNow());

        var dto = new HealthStatusDto(
            Status: snapshot.Status.ToString(),
            ServiceName: snapshot.Metadata.ServiceName,
            Version: snapshot.Metadata.Version,
            Environment: snapshot.Metadata.EnvironmentName,
            CheckedAtUtc: snapshot.CheckedAtUtc);

        return Task.FromResult(dto);
    }
}
