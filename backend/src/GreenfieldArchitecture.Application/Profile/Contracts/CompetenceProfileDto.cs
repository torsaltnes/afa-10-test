namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Full profile aggregate read model returned to API consumers.
/// </summary>
public sealed record CompetenceProfileDto(
    string UserId,
    DateTimeOffset LastUpdatedUtc,
    IReadOnlyList<EducationEntryDto> EducationEntries,
    IReadOnlyList<CertificateEntryDto> CertificateEntries,
    IReadOnlyList<CourseEntryDto> CourseEntries);
