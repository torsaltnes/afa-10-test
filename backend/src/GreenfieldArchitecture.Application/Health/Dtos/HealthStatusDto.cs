namespace GreenfieldArchitecture.Application.Health.Dtos;

/// <summary>
/// HTTP contract returned by the health endpoint.
/// Field names match the camelCase JSON the frontend consumes.
/// </summary>
public sealed record HealthStatusDto(
    string Status,
    string ServiceName,
    string Version,
    string Environment,
    DateTimeOffset CheckedAtUtc);
