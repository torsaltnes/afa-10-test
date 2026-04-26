namespace GreenfieldArchitecture.Application.Deviations.Dtos;

/// <summary>
/// Transport contract for creating a new deviation (POST body).
/// </summary>
public sealed record CreateDeviationRequest(
    string Title,
    string Description,
    string Severity,
    string? Status = null);
