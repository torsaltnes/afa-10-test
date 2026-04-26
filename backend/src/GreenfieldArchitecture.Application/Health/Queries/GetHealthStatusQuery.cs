namespace GreenfieldArchitecture.Application.Health.Queries;

/// <summary>
/// Marker query object used to request the current health status.
/// Carrying no mutable state, it establishes the query pattern from day one.
/// </summary>
public sealed record GetHealthStatusQuery;
