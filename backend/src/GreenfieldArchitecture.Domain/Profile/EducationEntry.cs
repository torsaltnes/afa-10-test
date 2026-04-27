namespace GreenfieldArchitecture.Domain.Profile;

/// <summary>
/// Represents one education credential owned by an employee.
/// </summary>
public sealed class EducationEntry
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string Institution { get; set; } = string.Empty;
    public int GraduationYear { get; set; }
}
