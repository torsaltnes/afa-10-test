namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Payload for updating an existing course entry.
/// </summary>
public sealed record UpdateCourseRequest(
    string CourseName,
    string Provider,
    DateOnly CompletionDate);
