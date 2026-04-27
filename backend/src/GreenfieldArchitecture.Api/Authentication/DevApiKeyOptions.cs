using Microsoft.AspNetCore.Authentication;

namespace GreenfieldArchitecture.Api.Authentication;

/// <summary>
/// Configuration options for the <see cref="DevApiKeyAuthHandler"/>.
/// Maps opaque Bearer tokens to employee identifiers.
/// The server owns this mapping; clients cannot self-assign an identity.
/// </summary>
public sealed class DevApiKeyOptions : AuthenticationSchemeOptions
{
    /// <summary>
    /// Dictionary of <c>token → employeeId</c> pairs loaded from configuration.
    /// In production this is replaced by a real issuer (JWT/OIDC); the handler
    /// only participates when this dictionary is non-empty.
    /// </summary>
    public Dictionary<string, string> ApiKeys { get; set; } = [];
}
