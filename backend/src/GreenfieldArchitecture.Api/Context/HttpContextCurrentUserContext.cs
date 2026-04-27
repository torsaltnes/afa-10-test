using GreenfieldArchitecture.Application.Profile.Abstractions;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace GreenfieldArchitecture.Api.Context;

/// <summary>
/// Resolves the current employee identity from the authenticated
/// <see cref="ClaimsPrincipal"/> on the active HTTP request.
///
/// The identity is set by <c>DevApiKeyAuthHandler</c> (or, once real auth is
/// introduced, by the JWT/OIDC middleware) and is therefore server-authoritative.
/// Unlike the previous implementation, this class no longer reads an
/// <c>X-Employee-Id</c> request header; accepting a user-supplied header as
/// identity would constitute an OWASP A01 / IDOR vulnerability.
/// </summary>
/// <remarks>
/// Throws <see cref="InvalidOperationException"/> when the request carries no
/// authenticated principal so that downstream code never operates without a
/// verified identity.  Profile endpoints are guarded by
/// <c>.RequireAuthorization()</c>, which rejects unauthenticated requests with
/// 401 before this property is ever accessed.
/// </remarks>
public sealed class HttpContextCurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
{
    /// <inheritdoc />
    public string UserId
    {
        get
        {
            var context = httpContextAccessor.HttpContext;

            // Read from the claims principal populated by the authentication middleware.
            // ClaimTypes.Name is set by DevApiKeyAuthHandler (and will be set by the
            // JWT/OIDC middleware when real auth is introduced).
            var claimsName = context?.User?.FindFirst(ClaimTypes.Name)?.Value
                          ?? context?.User?.Identity?.Name;

            if (!string.IsNullOrWhiteSpace(claimsName))
                return claimsName;

            // If we reach here, a protected endpoint was reached without authentication.
            // This should not happen when .RequireAuthorization() is applied correctly.
            throw new InvalidOperationException(
                "No authenticated user identity is available on this request. " +
                "Ensure the authentication middleware is configured and the endpoint " +
                "requires authorisation.");
        }
    }
}
