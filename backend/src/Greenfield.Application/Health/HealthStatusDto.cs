using Greenfield.Domain.Health;

namespace Greenfield.Application.Health;

/// <summary>Immutable snapshot of the service's health status returned by GET /health.</summary>
public sealed record HealthStatusDto(
    HealthState Status,
    string ServiceName,
    string Environment,
    string Version,
    DateTimeOffset TimestampUtc);
