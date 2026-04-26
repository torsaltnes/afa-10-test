namespace GreenfieldArchitecture.Domain.Deviations;

/// <summary>
/// Lifecycle status of a deviation / non-conformity.
/// </summary>
public enum DeviationStatus
{
    Open = 0,
    Investigating = 1,
    Resolved = 2,
    Closed = 3,
}
