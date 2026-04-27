using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Contracts;

/// <summary>
/// Read model returned to API consumers.
/// </summary>
public sealed record DeviationDto(
    Guid Id,
    string Title,
    string Description,
    DeviationSeverity Severity,
    DeviationStatus Status,
    string ReportedBy,
    DateTimeOffset ReportedAt,
    DateTimeOffset UpdatedAt);
