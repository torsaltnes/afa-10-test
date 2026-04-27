using Microsoft.AspNetCore.Http;

namespace GreenfieldArchitecture.Api.Filters;

/// <summary>
/// Endpoint filter that performs a defence-in-depth identity check after the
/// ASP.NET Core authentication middleware has run.
/// Returns <c>401 Unauthorized</c> when <see cref="HttpContext.User"/> does not
/// carry an authenticated identity.
///
/// NOTE: Profile endpoints use <c>.RequireAuthorization()</c> on the route group,
/// which rejects unauthenticated requests before this filter is reached.
/// This filter is retained as an additional safety net for any endpoint that
/// skips the standard authorization policy.
///
/// The previous implementation also accepted an <c>X-Employee-Id</c> request
/// header as a valid identity source.  That fallback has been removed because
/// accepting a user-supplied value as identity is an OWASP A01 / IDOR
/// vulnerability — any caller could impersonate another employee.  Identity is
/// now resolved exclusively from the <see cref="System.Security.Claims.ClaimsPrincipal"/>
/// set by the authentication middleware.
/// </summary>
public sealed class RequireUserIdentityFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var http = context.HttpContext;

        if (http.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Problem(
                title: "Unauthorized",
                detail: "An authenticated identity is required to access this resource. " +
                        "Provide a valid Bearer token via the Authorization header.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return await next(context);
    }
}

