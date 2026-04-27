using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Contracts;

/// <summary>
/// Payload for creating a new deviation.
/// </summary>
public sealed record CreateDeviationRequest(
    string Title,
    string Description,
    DeviationSeverity Severity,
    DeviationStatus Status,
    string ReportedBy);
