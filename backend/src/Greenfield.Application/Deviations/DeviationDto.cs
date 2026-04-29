using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Deviations;

/// <summary>Full deviation DTO including timeline and attachments.</summary>
public sealed record DeviationDto(
    Guid Id,
    string Title,
    string Description,
    DeviationStatus Status,
    DeviationSeverity Severity,
    DeviationCategory Category,
    string ReportedBy,
    string? AssignedTo,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? DueDate,
    IReadOnlyList<string> Tags,
    string? RootCause,
    string? CorrectiveAction,
    string? ClosureNotes,
    IReadOnlyList<ActivityDto> Timeline,
    IReadOnlyList<AttachmentDto> Attachments);
