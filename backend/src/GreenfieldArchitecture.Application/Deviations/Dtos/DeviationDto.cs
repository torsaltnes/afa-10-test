namespace GreenfieldArchitecture.Application.Deviations.Dtos;

/// <summary>
/// API response contract for a deviation resource.
/// Enum values are serialized as strings for frontend simplicity.
/// </summary>
public sealed record DeviationDto(
    Guid Id,
    string Title,
    string Description,
    string Severity,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset LastModifiedAtUtc);
