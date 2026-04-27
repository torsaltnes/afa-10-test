namespace GreenfieldArchitecture.Domain.Deviations;

/// <summary>
/// Represents a non-conformity or deviation in the system.
/// </summary>
public sealed class Deviation
{
    public Guid Id { get; init; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DeviationSeverity Severity { get; set; }
    public DeviationStatus Status { get; set; }
    public string ReportedBy { get; set; } = string.Empty;
    public DateTimeOffset ReportedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; set; }
}
