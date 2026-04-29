using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Deviations;

/// <summary>Timeline entry DTO – safe to serialise to the API layer.</summary>
public sealed record ActivityDto(
    Guid Id,
    Guid DeviationId,
    ActivityType Type,
    string Description,
    string PerformedBy,
    DateTimeOffset Timestamp,
    string? PreviousStatus,
    string? NewStatus);
