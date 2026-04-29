using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Deviations;

/// <summary>Lightweight deviation DTO used in list / search results.</summary>
public sealed record DeviationSummaryDto(
    Guid Id,
    string Title,
    DeviationStatus Status,
    DeviationSeverity Severity,
    DeviationCategory Category,
    string ReportedBy,
    string? AssignedTo,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? DueDate,
    IReadOnlyList<string> Tags,
    int AttachmentCount,
    int CommentCount);
