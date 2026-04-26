using System.Security.Claims;
using DeviationManagement.Api.Contracts.Requests;
using DeviationManagement.Api.Mapping;
using DeviationManagement.Application.Abstractions.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeviationManagement.Api.Controllers;

[ApiController]
[Route("api/deviations")]
[Authorize]
public sealed class DeviationsController(IDeviationService deviationService) : ControllerBase
{
    /// <summary>
    /// Returns the authenticated caller's subject identifier (JWT 'sub' /
    /// <see cref="ClaimTypes.NameIdentifier"/> claim), or <c>null</c> when the
    /// claim is absent from the token.  Callers MUST call
    /// <see cref="ResolveOwnerIdOrUnauthorized"/> to obtain a validated, non-null
    /// owner identifier rather than reading this property directly.
    /// </summary>
    private string? ResolveOwnerId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub");

    /// <summary>
    /// Resolves the owner identifier and writes an <see cref="UnauthorizedResult"/>
    /// into <paramref name="unauthorized"/> when the claim is missing.
    /// Returns <c>true</c> only when a non-null, non-empty owner ID was found.
    /// </summary>
    private bool TryGetOwnerId(out string ownerId, out IActionResult? unauthorized)
    {
        var id = ResolveOwnerId();
        if (string.IsNullOrWhiteSpace(id))
        {
            ownerId = string.Empty;
            unauthorized = Unauthorized(new ProblemDetails
            {
                Title = "Unauthorized",
                Detail = "A valid subject claim ('sub' / NameIdentifier) is required.",
                Status = StatusCodes.Status401Unauthorized
            });
            return false;
        }

        ownerId = id;
        unauthorized = null;
        return true;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (!TryGetOwnerId(out var ownerId, out var unauthorized))
            return unauthorized!;

        var items = await deviationService.GetAllAsync(ownerId, cancellationToken);
        return Ok(items.Select(DeviationApiMapper.ToApiResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetOwnerId(out var ownerId, out var unauthorized))
            return unauthorized!;

        var dto = await deviationService.GetByIdAsync(id, ownerId, cancellationToken);
        if (dto is null)
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = $"Deviation with id '{id}' was not found.",
                Status = StatusCodes.Status404NotFound
            });

        return Ok(DeviationApiMapper.ToApiResponse(dto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveDeviationApiRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetOwnerId(out var ownerId, out var unauthorized))
            return unauthorized!;

        var appRequest = DeviationApiMapper.ToApplicationRequest(request);
        var (dto, validationErrors) = await deviationService.CreateAsync(appRequest, ownerId, cancellationToken);

        if (validationErrors is not null)
            return ValidationProblem(new ValidationProblemDetails(validationErrors));

        var response = DeviationApiMapper.ToApiResponse(dto!);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveDeviationApiRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetOwnerId(out var ownerId, out var unauthorized))
            return unauthorized!;

        var appRequest = DeviationApiMapper.ToApplicationRequest(request);
        var (dto, notFound, forbidden, validationErrors) =
            await deviationService.UpdateAsync(id, appRequest, ownerId, cancellationToken);

        if (validationErrors is not null)
            return ValidationProblem(new ValidationProblemDetails(validationErrors));

        if (forbidden)
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "You do not have permission to modify this deviation.",
                Status = StatusCodes.Status403Forbidden
            });

        if (notFound)
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = $"Deviation with id '{id}' was not found.",
                Status = StatusCodes.Status404NotFound
            });

        return Ok(DeviationApiMapper.ToApiResponse(dto!));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetOwnerId(out var ownerId, out var unauthorized))
            return unauthorized!;

        var (deleted, forbidden) = await deviationService.DeleteAsync(id, ownerId, cancellationToken);

        if (forbidden)
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "You do not have permission to delete this deviation.",
                Status = StatusCodes.Status403Forbidden
            });

        if (!deleted)
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = $"Deviation with id '{id}' was not found.",
                Status = StatusCodes.Status404NotFound
            });

        return NoContent();
    }
}
