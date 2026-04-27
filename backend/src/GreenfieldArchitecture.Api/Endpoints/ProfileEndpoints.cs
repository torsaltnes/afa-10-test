using GreenfieldArchitecture.Application.Profile.Abstractions;
using GreenfieldArchitecture.Application.Profile.Contracts;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GreenfieldArchitecture.Api.Endpoints;

/// <summary>
/// Minimal API endpoints for the employee competence profile slice.
/// All routes are protected by <c>.RequireAuthorization()</c> so the ASP.NET Core
/// authentication/authorization pipeline rejects unauthenticated callers with 401
/// before any handler runs (OWASP A01 / IDOR prevention).
/// Identity is resolved exclusively from the <see cref="System.Security.Claims.ClaimsPrincipal"/>
/// populated by the authentication middleware — no user-supplied header is trusted.
/// </summary>
public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder routes)
    {
        // RequireAuthorization() delegates to the ASP.NET Core authorization middleware
        // (registered via AddAuthorization / UseAuthorization in Program.cs).
        // The DevApiKeyAuthHandler validates the Bearer token server-side and builds
        // the ClaimsPrincipal; any request without a valid token is rejected here.
        var group = routes
            .MapGroup("/api/profile")
            .WithTags("Profile")
            .RequireAuthorization();

        // ── Profile ──────────────────────────────────────────────────────────
        group.MapGet("/", GetProfileAsync)
            .WithName("GetMyProfile")
            .WithSummary("Returns the current employee's competence profile.");

        // ── Education ─────────────────────────────────────────────────────────
        group.MapPost("/education", CreateEducationAsync)
            .WithName("CreateEducation")
            .WithSummary("Adds an education entry to the profile.");

        group.MapPut("/education/{educationId:guid}", UpdateEducationAsync)
            .WithName("UpdateEducation")
            .WithSummary("Updates an existing education entry.");

        group.MapDelete("/education/{educationId:guid}", DeleteEducationAsync)
            .WithName("DeleteEducation")
            .WithSummary("Deletes an education entry.");

        // ── Certificates ──────────────────────────────────────────────────────
        group.MapPost("/certificates", CreateCertificateAsync)
            .WithName("CreateCertificate")
            .WithSummary("Adds a certificate entry to the profile.");

        group.MapPut("/certificates/{certificateId:guid}", UpdateCertificateAsync)
            .WithName("UpdateCertificate")
            .WithSummary("Updates an existing certificate entry.");

        group.MapDelete("/certificates/{certificateId:guid}", DeleteCertificateAsync)
            .WithName("DeleteCertificate")
            .WithSummary("Deletes a certificate entry.");

        // ── Courses ───────────────────────────────────────────────────────────
        group.MapPost("/courses", CreateCourseAsync)
            .WithName("CreateCourse")
            .WithSummary("Adds a course entry to the profile.");

        group.MapPut("/courses/{courseId:guid}", UpdateCourseAsync)
            .WithName("UpdateCourse")
            .WithSummary("Updates an existing course entry.");

        group.MapDelete("/courses/{courseId:guid}", DeleteCourseAsync)
            .WithName("DeleteCourse")
            .WithSummary("Deletes a course entry.");

        return routes;
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    private static async Task<Ok<CompetenceProfileDto>> GetProfileAsync(
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        var result = await service.GetMyProfileAsync(cancellationToken).ConfigureAwait(false);
        return TypedResults.Ok(result);
    }

    // ── Education ─────────────────────────────────────────────────────────────

    private static async Task<Results<Created<EducationEntryDto>, BadRequest<string>>> CreateEducationAsync(
        CreateEducationRequest request,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.AddEducationAsync(request, cancellationToken).ConfigureAwait(false);
            return TypedResults.Created($"/api/profile/education/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<Ok<EducationEntryDto>, NotFound, BadRequest<string>>> UpdateEducationAsync(
        Guid educationId,
        UpdateEducationRequest request,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.UpdateEducationAsync(educationId, request, cancellationToken).ConfigureAwait(false);
            return result is not null
                ? TypedResults.Ok(result)
                : TypedResults.NotFound();
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<NoContent, NotFound>> DeleteEducationAsync(
        Guid educationId,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        var deleted = await service.DeleteEducationAsync(educationId, cancellationToken).ConfigureAwait(false);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    // ── Certificates ──────────────────────────────────────────────────────────

    private static async Task<Results<Created<CertificateEntryDto>, BadRequest<string>>> CreateCertificateAsync(
        CreateCertificateRequest request,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.AddCertificateAsync(request, cancellationToken).ConfigureAwait(false);
            return TypedResults.Created($"/api/profile/certificates/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<Ok<CertificateEntryDto>, NotFound, BadRequest<string>>> UpdateCertificateAsync(
        Guid certificateId,
        UpdateCertificateRequest request,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.UpdateCertificateAsync(certificateId, request, cancellationToken).ConfigureAwait(false);
            return result is not null
                ? TypedResults.Ok(result)
                : TypedResults.NotFound();
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<NoContent, NotFound>> DeleteCertificateAsync(
        Guid certificateId,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        var deleted = await service.DeleteCertificateAsync(certificateId, cancellationToken).ConfigureAwait(false);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    // ── Courses ───────────────────────────────────────────────────────────────

    private static async Task<Results<Created<CourseEntryDto>, BadRequest<string>>> CreateCourseAsync(
        CreateCourseRequest request,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.AddCourseAsync(request, cancellationToken).ConfigureAwait(false);
            return TypedResults.Created($"/api/profile/courses/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<Ok<CourseEntryDto>, NotFound, BadRequest<string>>> UpdateCourseAsync(
        Guid courseId,
        UpdateCourseRequest request,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.UpdateCourseAsync(courseId, request, cancellationToken).ConfigureAwait(false);
            return result is not null
                ? TypedResults.Ok(result)
                : TypedResults.NotFound();
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<NoContent, NotFound>> DeleteCourseAsync(
        Guid courseId,
        IEmployeeCompetenceProfileService service,
        CancellationToken cancellationToken)
    {
        var deleted = await service.DeleteCourseAsync(courseId, cancellationToken).ConfigureAwait(false);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}
