namespace GreenfieldArchitecture.Application.Profile.Contracts;

/// <summary>
/// Payload for creating an education entry.
/// </summary>
public sealed record CreateEducationRequest(
    string Degree,
    string Institution,
    int GraduationYear);
