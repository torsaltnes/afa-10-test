namespace GreenfieldArchitecture.Domain.Profile;

/// <summary>
/// Aggregate root that holds a single employee's competence profile,
/// owning three child entry collections.
/// </summary>
public sealed class EmployeeCompetenceProfile
{
    public string UserId { get; init; } = string.Empty;
    public DateTimeOffset LastUpdatedUtc { get; set; }

    public List<EducationEntry> EducationEntries { get; init; } = [];
    public List<CertificateEntry> CertificateEntries { get; init; } = [];
    public List<CourseEntry> CourseEntries { get; init; } = [];
}
