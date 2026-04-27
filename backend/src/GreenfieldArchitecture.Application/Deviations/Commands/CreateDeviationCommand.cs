using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Commands;

/// <summary>
/// Write model for creating a new deviation after transport-layer mapping.
/// </summary>
public sealed record CreateDeviationCommand(
    string Title,
    string Description,
    DeviationSeverity Severity,
    DeviationStatus Status);
