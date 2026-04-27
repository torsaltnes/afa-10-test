namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Payload for creating a course entry.
/// </summary>
public sealed record CreateCourseRequest(
    string CourseName,
    string Provider,
    DateOnly CompletionDate);
