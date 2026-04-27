namespace GreenfieldArchitecture.Domain.Deviations;

/// <summary>
/// Severity classification for a deviation / non-conformity.
/// Values are ordered from least to most critical for filtering and sorting.
/// </summary>
public enum DeviationSeverity
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
}
