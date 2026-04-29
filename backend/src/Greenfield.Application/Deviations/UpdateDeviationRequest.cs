using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Deviations;

/// <summary>Command to update the editable fields of an existing deviation.</summary>
public sealed record UpdateDeviationRequest(
    string Title,
    string Description,
    DeviationSeverity Severity,
    DeviationCategory Category,
    string? AssignedTo = null,
    DateTimeOffset? DueDate = null,
    IReadOnlyList<string>? Tags = null,
    string? RootCause = null,
    string? CorrectiveAction = null,
    string? ClosureNotes = null,
    string UpdatedBy = "system");
