using GreenfieldArchitecture.Application.Abstractions.Deviations;
using GreenfieldArchitecture.Application.Deviations.Commands;
using GreenfieldArchitecture.Application.Deviations.Dtos;
using GreenfieldArchitecture.Application.Deviations.Queries;
using GreenfieldArchitecture.Domain.Deviations;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace GreenfieldArchitecture.Api.Endpoints;

/// <summary>
/// Minimal API endpoints for the deviation domain slice.
/// </summary>
public static class DeviationEndpoints
{
    public static IEndpointRouteBuilder MapDeviationEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/deviations").WithTags("Deviations");

        group.MapGet("/", ListDeviationsAsync)
            .WithName("ListDeviations")
            .WithSummary("Returns all deviations ordered by last-modified descending.")
            .AllowAnonymous()
            .Produces<IReadOnlyList<DeviationDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", GetDeviationByIdAsync)
            .WithName("GetDeviationById")
            .WithSummary("Returns a single deviation by its unique identifier.")
            .AllowAnonymous()
            .Produces<DeviationDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateDeviationAsync)
            .WithName("CreateDeviation")
            .WithSummary("Creates a new deviation.")
            .RequireAuthorization()
            .Produces<DeviationDto>(StatusCodes.Status201Created)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapPut("/{id:guid}", UpdateDeviationAsync)
            .WithName("UpdateDeviation")
            .WithSummary("Replaces an existing deviation.")
            .RequireAuthorization()
            .Produces<DeviationDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapDelete("/{id:guid}", DeleteDeviationAsync)
            .WithName("DeleteDeviation")
            .WithSummary("Removes a deviation.")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        return routes;
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    private static async Task<Ok<IReadOnlyList<DeviationDto>>> ListDeviationsAsync(
        IDeviationService service,
        CancellationToken cancellationToken)
    {
        var items = await service.ListAsync(new ListDeviationsQuery(), cancellationToken)
            .ConfigureAwait(false);

        return TypedResults.Ok(items);
    }

    private static async Task<Results<Ok<DeviationDto>, NotFound>> GetDeviationByIdAsync(
        Guid id,
        IDeviationService service,
        CancellationToken cancellationToken)
    {
        var dto = await service.GetByIdAsync(new GetDeviationByIdQuery(id), cancellationToken)
            .ConfigureAwait(false);

        return dto is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(dto);
    }

    private static async Task<Results<Created<DeviationDto>, BadRequest<ProblemDetails>>> CreateDeviationAsync(
        CreateDeviationRequest request,
        IDeviationService service,
        CancellationToken cancellationToken)
    {
        if (!TryParseSeverity(request.Severity, out var severity))
        {
            return TypedResults.BadRequest(Problem(
                $"Invalid severity '{request.Severity}'. Allowed: Low, Medium, High, Critical."));
        }

        var status = DeviationStatus.Open;
        if (request.Status is not null && !TryParseStatus(request.Status, out status))
        {
            return TypedResults.BadRequest(Problem(
                $"Invalid status '{request.Status}'. Allowed: Open, Investigating, Resolved, Closed."));
        }

        if (string.IsNullOrWhiteSpace(request.Title))
            return TypedResults.BadRequest(Problem("Title is required."));

        if (string.IsNullOrWhiteSpace(request.Description))
            return TypedResults.BadRequest(Problem("Description is required."));

        var command = new CreateDeviationCommand(request.Title, request.Description, severity, status);
        var dto = await service.CreateAsync(command, cancellationToken).ConfigureAwait(false);

        return TypedResults.Created($"/api/deviations/{dto.Id}", dto);
    }

    private static async Task<Results<Ok<DeviationDto>, NotFound, BadRequest<ProblemDetails>>> UpdateDeviationAsync(
        Guid id,
        UpdateDeviationRequest request,
        IDeviationService service,
        CancellationToken cancellationToken)
    {
        if (id != request.Id)
        {
            return TypedResults.BadRequest(Problem(
                "Route id and body id must match."));
        }

        if (!TryParseSeverity(request.Severity, out var severity))
        {
            return TypedResults.BadRequest(Problem(
                $"Invalid severity '{request.Severity}'. Allowed: Low, Medium, High, Critical."));
        }

        if (!TryParseStatus(request.Status, out var status))
        {
            return TypedResults.BadRequest(Problem(
                $"Invalid status '{request.Status}'. Allowed: Open, Investigating, Resolved, Closed."));
        }

        if (string.IsNullOrWhiteSpace(request.Title))
            return TypedResults.BadRequest(Problem("Title is required."));

        if (string.IsNullOrWhiteSpace(request.Description))
            return TypedResults.BadRequest(Problem("Description is required."));

        var command = new UpdateDeviationCommand(id, request.Title, request.Description, severity, status);
        var dto = await service.UpdateAsync(command, cancellationToken).ConfigureAwait(false);

        return dto is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(dto);
    }

    private static async Task<Results<NoContent, NotFound>> DeleteDeviationAsync(
        Guid id,
        IDeviationService service,
        CancellationToken cancellationToken)
    {
        var deleted = await service.DeleteAsync(new DeleteDeviationCommand(id), cancellationToken)
            .ConfigureAwait(false);

        return deleted
            ? TypedResults.NoContent()
            : TypedResults.NotFound();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static bool TryParseSeverity(string? value, out DeviationSeverity severity)
        => Enum.TryParse(value, ignoreCase: true, out severity);

    private static bool TryParseStatus(string? value, out DeviationStatus status)
        => Enum.TryParse(value, ignoreCase: true, out status);

    private static ProblemDetails Problem(string detail) => new()
    {
        Status = StatusCodes.Status400BadRequest,
        Title = "Bad Request",
        Detail = detail,
    };
}
