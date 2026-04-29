namespace Greenfield.Domain.Health;

/// <summary>Represents the aggregate health state of the service.</summary>
public enum HealthState
{
    Healthy,
    Degraded,
    Unhealthy,
}
