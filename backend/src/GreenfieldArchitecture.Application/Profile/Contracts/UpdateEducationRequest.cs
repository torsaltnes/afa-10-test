namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Payload for updating an existing education entry.
/// </summary>
public sealed record UpdateEducationRequest(
    string Degree,
    string Institution,
    int GraduationYear);
