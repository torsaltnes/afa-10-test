namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Read model for a single course entry.
/// </summary>
public sealed record CourseEntryDto(
    Guid Id,
    string CourseName,
    string Provider,
    DateOnly CompletionDate);
