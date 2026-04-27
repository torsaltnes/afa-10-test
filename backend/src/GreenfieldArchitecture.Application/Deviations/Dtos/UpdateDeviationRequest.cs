namespace GreenfieldArchitecture.Application.Deviations.Dtos;

/// <summary>
/// Transport contract for replacing an existing deviation (PUT body).
/// The endpoint must reject requests where the route id and body id differ.
/// </summary>
public sealed record UpdateDeviationRequest(
    Guid Id,
    string Title,
    string Description,
    string Severity,
    string Status);
