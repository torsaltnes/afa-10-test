namespace Greenfield.Domain.Deviations;

/// <summary>Represents the workflow stage of a deviation.</summary>
public enum DeviationStatus
{
    Registered,
    UnderAssessment,
    UnderInvestigation,
    CorrectiveAction,
    Closed,
}
