using GreenfieldArchitecture.Application.Profile.Abstractions;

namespace GreenfieldArchitecture.Infrastructure.Profile;

/// <summary>
/// Minimal stub user context used until real authentication is introduced.
/// Returns a fixed, well-known employee identifier so the profile ownership
/// model is exercised without requiring an auth system.
/// Replace this implementation with a real JWT/claims-based one when auth lands.
/// </summary>
public sealed class StaticCurrentUserContext : ICurrentUserContext
{
    /// <summary>Fixed user id used for all requests in the current auth-free stage.</summary>
    public string UserId => "employee-001";
}
