using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Deviations;

/// <summary>Command to register a new deviation.</summary>
public sealed record CreateDeviationRequest(
    string Title,
    string Description,
    DeviationSeverity Severity,
    DeviationCategory Category,
    string ReportedBy,
    string? AssignedTo = null,
    DateTimeOffset? DueDate = null,
    IReadOnlyList<string>? Tags = null);
