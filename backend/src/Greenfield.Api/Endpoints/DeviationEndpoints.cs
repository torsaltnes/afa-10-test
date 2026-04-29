using System.Text;
using Greenfield.Application.Abstractions;
using Greenfield.Application.Deviations;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Greenfield.Api.Endpoints;

/// <summary>
/// Registers all <c>/api/deviations</c> endpoints using Minimal API route groups.
/// </summary>
public static class DeviationEndpoints
{
    public static IEndpointRouteBuilder MapDeviationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app
            .MapGroup("/api/deviations")
            .WithTags("Deviations");

        // ── List / search ─────────────────────────────────────────────────
        group.MapGet("/", GetDeviations)
             .WithName("GetDeviations");

        // ── Export CSV (must be registered before /{id} to avoid capture) ─
        group.MapGet("/export", ExportCsv)
             .WithName("ExportDeviationsCsv");

        // ── Single deviation ──────────────────────────────────────────────
        group.MapGet("/{id:guid}", GetDeviationById)
             .WithName("GetDeviationById");

        group.MapPost("/", CreateDeviation)
             .WithName("CreateDeviation");

        group.MapPut("/{id:guid}", UpdateDeviation)
             .WithName("UpdateDeviation");

        group.MapDelete("/{id:guid}", DeleteDeviation)
             .WithName("DeleteDeviation");

        // ── Workflow transition ───────────────────────────────────────────
        group.MapPost("/{id:guid}/transition", TransitionDeviation)
             .WithName("TransitionDeviation");

        // ── Timeline ─────────────────────────────────────────────────────
        group.MapGet("/{id:guid}/timeline", GetTimeline)
             .WithName("GetDeviationTimeline");

        group.MapPost("/{id:guid}/comments", AddComment)
             .WithName("AddDeviationComment");

        // ── Attachments ───────────────────────────────────────────────────
        group.MapGet("/{id:guid}/attachments", GetAttachments)
             .WithName("GetDeviationAttachments");

        group.MapPost("/{id:guid}/attachments", UploadAttachment)
             .WithName("UploadDeviationAttachment");

        group.MapDelete("/{id:guid}/attachments/{attachmentId:guid}", RemoveAttachment)
             .WithName("RemoveDeviationAttachment");

        return app;
    }

    // ── Handlers ──────────────────────────────────────────────────────────

    private static async Task<Ok<Greenfield.Application.Common.PagedResult<DeviationSummaryDto>>> GetDeviations(
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
