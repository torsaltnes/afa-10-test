using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Contracts;

/// <summary>
/// Payload for updating an existing deviation.
/// </summary>
public sealed record UpdateDeviationRequest(
    string Title,
    string Description,
    DeviationSeverity Severity,
    DeviationStatus Status,
    string ReportedBy);
