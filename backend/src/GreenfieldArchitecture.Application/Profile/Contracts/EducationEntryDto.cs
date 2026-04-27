namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Read model for a single education entry.
/// </summary>
public sealed record EducationEntryDto(
    Guid Id,
    string Degree,
    string Institution,
    int GraduationYear);
