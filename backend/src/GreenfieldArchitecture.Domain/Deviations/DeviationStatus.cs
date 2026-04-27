namespace GreenfieldArchitecture.Domain.Deviations;

/// <summary>
/// Tracks the workflow state of a deviation.
/// </summary>
public enum DeviationStatus
{
    Open,
    InProgress,
    Resolved,
    Closed,
}
