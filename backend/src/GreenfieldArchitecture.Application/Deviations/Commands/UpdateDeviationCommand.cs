using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Commands;

/// <summary>
/// Write model for replacing an existing deviation after transport-layer mapping.
/// </summary>
public sealed record UpdateDeviationCommand(
    Guid Id,
    string Title,
    string Description,
    DeviationSeverity Severity,
    DeviationStatus Status);
