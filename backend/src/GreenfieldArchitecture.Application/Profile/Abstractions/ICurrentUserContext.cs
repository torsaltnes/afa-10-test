namespace GreenfieldArchitecture.Application.Profile.Abstractions;

/// <summary>
/// Provides the identity of the currently authenticated employee.
/// Implementations will be replaced with real auth once auth is introduced.
/// </summary>
public interface ICurrentUserContext
{
    /// <summary>Gets the user id of the currently active employee.</summary>
    string UserId { get; }
}
