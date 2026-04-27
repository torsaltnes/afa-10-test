using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace GreenfieldArchitecture.Api.Authentication;

/// <summary>
/// Custom <see cref="AuthenticationHandler{TOptions}"/> for the "DevApiKey" scheme.
/// Reads an <c>Authorization: Bearer &lt;token&gt;</c> header and validates it
/// against a server-side configured token-to-employee-id map.
///
/// Security properties:
/// <list type="bullet">
///   <item>The mapping is server-owned — clients cannot forge a different identity
///         by supplying an arbitrary value.</item>
///   <item>The handler populates <see cref="ClaimsPrincipal"/> so that
///         <see cref="ICurrentUserContext"/> reads from claims, not from
///         a user-supplied header.</item>
///   <item>Returns <see cref="AuthenticateResult.Fail"/> for unknown tokens so
///         the framework emits 401; profile endpoints call
///         <c>.RequireAuthorization()</c> to enforce this.</item>
/// </list>
///
/// When real authentication (JWT/OIDC) is introduced, replace the
/// <c>"DevApiKey"</c> scheme registration with a JWT Bearer scheme; this class
/// and <see cref="DevApiKeyOptions"/> can then be removed.
/// </summary>
public sealed class DevApiKeyAuthHandler(
    IOptionsMonitor<DevApiKeyOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<DevApiKeyOptions>(options, logger, encoder)
{
    private const string BearerPrefix = "Bearer ";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(authHeader) ||
            !authHeader.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            // No Bearer header — not our problem; other schemes (or anonymous) may apply.
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var token = authHeader[BearerPrefix.Length..].Trim();

        if (string.IsNullOrWhiteSpace(token) ||
            !Options.ApiKeys.TryGetValue(token, out var employeeId))
        {
            return Task.FromResult(
                AuthenticateResult.Fail("The provided Bearer token is not recognised."));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, employeeId),
            new Claim(ClaimTypes.NameIdentifier, employeeId),
        };

        var identity  = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket    = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
