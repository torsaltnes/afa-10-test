namespace GreenfieldArchitecture.Domain.Profile;

/// <summary>
/// Represents one completed course owned by an employee.
/// </summary>
public sealed class CourseEntry
{
    public Guid Id { get; init; }
    public string UserId { get; init; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public DateOnly CompletionDate { get; set; }
}
