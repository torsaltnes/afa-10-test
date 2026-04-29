namespace Greenfield.Domain.Deviations;

/// <summary>
/// Aggregate root representing a single deviation / non-conformity report.
/// Mutable properties are updated by the application service during workflow transitions.
/// </summary>
public sealed class Deviation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DeviationStatus Status { get; set; } = DeviationStatus.Registered;
    public DeviationSeverity Severity { get; set; }
    public DeviationCategory Category { get; set; }
    public string ReportedBy { get; init; } = string.Empty;
    public string? AssignedTo { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DueDate { get; set; }
    public List<string> Tags { get; set; } = [];
    public string? RootCause { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? ClosureNotes { get; set; }
    public List<DeviationActivity> Timeline { get; } = [];
    public List<DeviationAttachment> Attachments { get; } = [];
}
