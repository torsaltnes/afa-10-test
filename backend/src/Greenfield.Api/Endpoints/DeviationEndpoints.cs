using System.Text;
using Greenfield.Application.Abstractions;
using Greenfield.Application.Common;
using Greenfield.Application.Deviations;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Greenfield.Api.Endpoints;

/// <summary>
/// Registers all <c>/api/deviations</c> endpoints using Minimal API route groups.
/// </summary>
/// <remarks>
/// Routing audit note: collection GET/POST were previously mapped to <c>"/"</c>
/// which produced a trailing-slash canonical path (<c>/api/deviations/</c>).
/// They are now mapped to <see cref="string.Empty"/> so the canonical path is
/// <c>/api/deviations</c> with no trailing slash, matching all consumer expectations.
/// </remarks>
public static class DeviationEndpoints
{
    public static IEndpointRouteBuilder MapDeviationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app
            .MapGroup("/api/deviations")
            .WithTags("Deviations");

        // ── List / search ─────────────────────────────────────────────────
        // Mapped to string.Empty (not "/") so canonical path is /api/deviations.
        group.MapGet(string.Empty, GetDeviations)
             .WithName("GetDeviations")
             .WithSummary("List deviations")
             .WithDescription(
                 "Returns a paginated, filtered list of deviation summaries. " +
                 "Supports filtering by status, severity, category, assignee, and free-text search. " +
                 "Results are sorted and paged according to the supplied query parameters.")
             .Produces<PagedResult<DeviationSummaryDto>>(StatusCodes.Status200OK);

        // ── Export CSV (must be registered before /{id} to avoid capture) ─
        group.MapGet("/export", ExportCsv)
             .WithName("ExportDeviationsCsv")
             .WithSummary("Export deviations as CSV")
             .WithDescription(
                 "Exports the current filtered deviation list as a CSV file. " +
                 "Applies the same filters as the list endpoint. " +
                 "Formula-injection characters are neutralized for spreadsheet safety.")
             .Produces(StatusCodes.Status200OK, contentType: "text/csv");

        // ── Single deviation ──────────────────────────────────────────────
        group.MapGet("/{id:guid}", GetDeviationById)
             .WithName("GetDeviationById")
             .WithSummary("Get a deviation by ID")
             .WithDescription(
                 "Returns the full deviation record including its timeline of activities " +
                 "and list of attachments. Returns 404 if no deviation with the given ID exists.")
             .Produces<DeviationDto>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status404NotFound);

        // ── Create (mapped to string.Empty so canonical path is /api/deviations) ─
        group.MapPost(string.Empty, CreateDeviation)
             .WithName("CreateDeviation")
             .WithSummary("Create a new deviation")
             .WithDescription(
                 "Registers a new deviation in the system with status Registered. " +
                 "Returns 201 Created with a Location header pointing at the new resource.")
             .Accepts<CreateDeviationRequest>("application/json")
             .Produces<DeviationDto>(StatusCodes.Status201Created)
             .Produces<string>(StatusCodes.Status400BadRequest);

        group.MapPut("/{id:guid}", UpdateDeviation)
             .WithName("UpdateDeviation")
             .WithSummary("Update a deviation")
             .WithDescription(
                 "Updates the mutable fields of an existing deviation. " +
                 "Returns 404 if the deviation does not exist, 400 for validation failures.")
             .Accepts<UpdateDeviationRequest>("application/json")
             .Produces<DeviationDto>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status404NotFound)
             .Produces<string>(StatusCodes.Status400BadRequest);

        group.MapDelete("/{id:guid}", DeleteDeviation)
             .WithName("DeleteDeviation")
             .WithSummary("Delete a deviation")
             .WithDescription(
                 "Permanently removes a deviation and all associated timeline entries " +
                 "and attachments. Returns 204 on success, 404 if not found.")
             .Produces(StatusCodes.Status204NoContent)
             .Produces(StatusCodes.Status404NotFound);

        // ── Workflow transition ───────────────────────────────────────────
        group.MapPost("/{id:guid}/transition", TransitionDeviation)
             .WithName("TransitionDeviation")
             .WithSummary("Transition deviation status")
             .WithDescription(
                 "Moves a deviation to a new workflow status following the permitted transition table. " +
                 "Returns 400 if the requested transition is not allowed from the current status.")
             .Accepts<TransitionDeviationRequest>("application/json")
             .Produces<DeviationDto>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status404NotFound)
             .Produces<string>(StatusCodes.Status400BadRequest);

        // ── Timeline ─────────────────────────────────────────────────────
        group.MapGet("/{id:guid}/timeline", GetTimeline)
             .WithName("GetDeviationTimeline")
             .WithSummary("Get deviation timeline")
             .WithDescription(
                 "Returns all activity entries for a deviation in chronological order, " +
                 "including status changes, comments, and attachment events.")
             .Produces<IReadOnlyList<ActivityDto>>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{id:guid}/comments", AddComment)
             .WithName("AddDeviationComment")
             .WithSummary("Add a comment to a deviation")
             .WithDescription(
                 "Appends a free-text comment activity to the deviation's timeline. " +
                 "Returns 201 Created with the new activity record.")
             .Accepts<AddCommentRequest>("application/json")
             .Produces<ActivityDto>(StatusCodes.Status201Created)
             .Produces(StatusCodes.Status404NotFound)
             .Produces<string>(StatusCodes.Status400BadRequest);

        // ── Attachments ───────────────────────────────────────────────────
        group.MapGet("/{id:guid}/attachments", GetAttachments)
             .WithName("GetDeviationAttachments")
             .WithSummary("List deviation attachments")
             .WithDescription(
                 "Returns metadata for all attachments associated with the deviation. " +
                 "Actual file content is not included in this response.")
             .Produces<IReadOnlyList<AttachmentDto>>(StatusCodes.Status200OK)
             .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/{id:guid}/attachments", UploadAttachment)
             .WithName("UploadDeviationAttachment")
             .WithSummary("Upload an attachment to a deviation")
             .WithDescription(
                 "Uploads a base64-encoded file as an attachment to the deviation. " +
                 "Maximum decoded size is 5 MiB. Returns 201 Created with attachment metadata.")
             .Accepts<UploadAttachmentRequest>("application/json")
             .Produces<AttachmentDto>(StatusCodes.Status201Created)
             .Produces(StatusCodes.Status404NotFound)
             .Produces<string>(StatusCodes.Status400BadRequest);

        group.MapDelete("/{id:guid}/attachments/{attachmentId:guid}", RemoveAttachment)
             .WithName("RemoveDeviationAttachment")
             .WithSummary("Remove an attachment from a deviation")
             .WithDescription(
                 "Permanently removes an attachment from the deviation. " +
                 "Returns 204 No Content on success, 404 if either the deviation or attachment is not found.")
             .Produces(StatusCodes.Status204NoContent)
             .Produces(StatusCodes.Status404NotFound);

        return app;
    }

    // ── Handlers ──────────────────────────────────────────────────────────

    private static async Task<Ok<PagedResult<DeviationSummaryDto>>> GetDeviations(
        [AsParameters] DeviationListQuery query,
        IDeviationService service,
        CancellationToken ct)
    {
        var result = await service.GetDeviationsAsync(query, ct);
        return TypedResults.Ok(result);
    }

    private static async Task<IResult> ExportCsv(
        [AsParameters] DeviationListQuery query,
        IDeviationService service,
        CancellationToken ct)
    {
        var csv = await service.ExportToCsvAsync(query, ct);
        return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", "deviations.csv");
    }

    private static async Task<Results<Ok<DeviationDto>, NotFound>> GetDeviationById(
        Guid id,
        IDeviationService service,
        CancellationToken ct)
    {
        var dto = await service.GetDeviationByIdAsync(id, ct);
        return dto is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(dto);
    }

    private static async Task<Results<Created<DeviationDto>, BadRequest<string>>> CreateDeviation(
        CreateDeviationRequest request,
        IDeviationService service,
        CancellationToken ct)
    {
        try
        {
            var dto = await service.CreateDeviationAsync(request, ct);
            return TypedResults.Created($"/api/deviations/{dto.Id}", dto);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<Ok<DeviationDto>, NotFound, BadRequest<string>>> UpdateDeviation(
        Guid id,
        UpdateDeviationRequest request,
        IDeviationService service,
        CancellationToken ct)
    {
        try
        {
            var dto = await service.UpdateDeviationAsync(id, request, ct);
            if (dto is null) return TypedResults.NotFound();
            return TypedResults.Ok(dto);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<NoContent, NotFound>> DeleteDeviation(
        Guid id,
        IDeviationService service,
        CancellationToken ct)
    {
        var deleted = await service.DeleteDeviationAsync(id, ct);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    private static async Task<Results<Ok<DeviationDto>, NotFound, BadRequest<string>>> TransitionDeviation(
        Guid id,
        TransitionDeviationRequest request,
        IDeviationService service,
        CancellationToken ct)
    {
        try
        {
            var (dto, error) = await service.TransitionDeviationAsync(id, request, ct);
            if (error is not null) return TypedResults.BadRequest(error);
            if (dto is null)       return TypedResults.NotFound();
            return TypedResults.Ok(dto);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<Ok<IReadOnlyList<ActivityDto>>, NotFound>> GetTimeline(
        Guid id,
        IDeviationService service,
        CancellationToken ct)
    {
        var dto = await service.GetDeviationByIdAsync(id, ct);
        if (dto is null) return TypedResults.NotFound();

        var timeline = await service.GetTimelineAsync(id, ct);
        return TypedResults.Ok(timeline);
    }

    private static async Task<Results<Created<ActivityDto>, NotFound, BadRequest<string>>> AddComment(
        Guid id,
        AddCommentRequest request,
        IDeviationService service,
        CancellationToken ct)
    {
        try
        {
            var activity = await service.AddCommentAsync(id, request, ct);
            if (activity is null) return TypedResults.NotFound();
            return TypedResults.Created($"/api/deviations/{id}/timeline/{activity.Id}", activity);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<Ok<IReadOnlyList<AttachmentDto>>, NotFound>> GetAttachments(
        Guid id,
        IDeviationService service,
        CancellationToken ct)
    {
        var attachments = await service.GetAttachmentsAsync(id, ct);
        if (attachments is null) return TypedResults.NotFound();
        return TypedResults.Ok(attachments);
    }

    private static async Task<Results<Created<AttachmentDto>, NotFound, BadRequest<string>>> UploadAttachment(
        Guid id,
        UploadAttachmentRequest request,
        IDeviationService service,
        CancellationToken ct)
    {
        try
        {
            var dto = await service.AddAttachmentAsync(id, request, ct);
            if (dto is null) return TypedResults.NotFound();
            return TypedResults.Created($"/api/deviations/{id}/attachments/{dto.Id}", dto);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(ex.Message);
        }
    }

    private static async Task<Results<NoContent, NotFound>> RemoveAttachment(
        Guid id,
        Guid attachmentId,
        IDeviationService service,
        CancellationToken ct)
    {
        var removed = await service.RemoveAttachmentAsync(id, attachmentId, ct);
        return removed ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}
