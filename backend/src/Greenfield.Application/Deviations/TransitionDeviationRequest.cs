using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Deviations;

/// <summary>Command to advance (or roll back) a deviation through the workflow.</summary>
public sealed record TransitionDeviationRequest(
    DeviationStatus NewStatus,
    string PerformedBy,
    string? Comment = null,
    string? RootCause = null,
    string? CorrectiveAction = null,
    string? ClosureNotes = null);
