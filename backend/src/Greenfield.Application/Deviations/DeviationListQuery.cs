using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Deviations;

/// <summary>Query parameters for the deviation list endpoint.</summary>
public sealed record DeviationListQuery(
    string? Search = null,
    DeviationStatus? Status = null,
    DeviationSeverity? Severity = null,
    DeviationCategory? Category = null,
    string? AssignedTo = null,
    int Page = 1,
    int PageSize = 20,
    string SortBy = "createdAt",
    bool SortDescending = true);
