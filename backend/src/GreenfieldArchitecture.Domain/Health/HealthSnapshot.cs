namespace GreenfieldArchitecture.Domain.Health;

/// <summary>
/// Domain snapshot produced during a health check evaluation.
/// </summary>
public sealed record HealthSnapshot(
    HealthState Status,
    ApplicationMetadata Metadata,
    DateTimeOffset CheckedAtUtc);
