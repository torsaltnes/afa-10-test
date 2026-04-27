using GreenfieldArchitecture.Application.Profile.Contracts;
using GreenfieldArchitecture.Domain.Profile;

namespace GreenfieldArchitecture.Application.Profile.Mappings;

/// <summary>
/// Extension methods for mapping between profile domain objects and DTOs.
/// </summary>
public static class ProfileMappings
{
    public static CompetenceProfileDto ToDto(this EmployeeCompetenceProfile profile) =>
        new(
            profile.UserId,
            profile.LastUpdatedUtc,
            [.. profile.EducationEntries.Select(e => e.ToDto())],
            [.. profile.CertificateEntries.Select(c => c.ToDto())],
            [.. profile.CourseEntries.Select(c => c.ToDto())]);

    public static EducationEntryDto ToDto(this EducationEntry entry) =>
        new(entry.Id, entry.Degree, entry.Institution, entry.GraduationYear);

    public static CertificateEntryDto ToDto(this CertificateEntry entry) =>
        new(entry.Id, entry.CertificateName, entry.IssuingOrganization, entry.DateEarned);

    public static CourseEntryDto ToDto(this CourseEntry entry) =>
        new(entry.Id, entry.CourseName, entry.Provider, entry.CompletionDate);
}
