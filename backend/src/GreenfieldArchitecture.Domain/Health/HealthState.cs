namespace GreenfieldArchitecture.Domain.Health;

/// <summary>
/// Represents the health state of the application.
/// Extensible for future Degraded / Unhealthy states.
/// </summary>
public enum HealthState
{
    Healthy = 0,
    Degraded = 1,
    Unhealthy = 2,
}
