using GreenfieldArchitecture.Application.Abstractions.Deviations;
using GreenfieldArchitecture.Application.Deviations.Commands;
using GreenfieldArchitecture.Application.Deviations.Dtos;
using GreenfieldArchitecture.Application.Deviations.Queries;
using GreenfieldArchitecture.Domain.Deviations;
using Microsoft.Extensions.Logging;

namespace GreenfieldArchitecture.Application.Deviations.Services;

/// <summary>
/// Orchestrates deviation use-cases: validation, domain operations, DTO mapping.
/// </summary>
public sealed class DeviationService(
    IDeviationRepository repository,
    TimeProvider timeProvider,
    ILogger<DeviationService> logger) : IDeviationService
{
    // ── List ──────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<DeviationDto>> ListAsync(
        ListDeviationsQuery query,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Listing all deviations");

        var items = await repository.ListAsync(cancellationToken).ConfigureAwait(false);

        return [.. items
            .OrderByDescending(d => d.LastModifiedAtUtc)
            .Select(ToDto)];
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────

    public async Task<DeviationDto?> GetByIdAsync(
        GetDeviationByIdQuery query,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Getting deviation {Id}", query.Id);

        var deviation = await repository.GetByIdAsync(query.Id, cancellationToken)
            .ConfigureAwait(false);

        return deviation is null ? null : ToDto(deviation);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public async Task<DeviationDto> CreateAsync(
        CreateDeviationCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Title, nameof(command.Title));
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Description, nameof(command.Description));

        var now = timeProvider.GetUtcNow();

        var deviation = Deviation.Create(
            title: command.Title,
            description: command.Description,
            severity: command.Severity,
            status: command.Status,
            createdAtUtc: now);

        await repository.AddAsync(deviation, cancellationToken).ConfigureAwait(false);

        logger.LogInformation("Created deviation {Id} with title {Title}", deviation.Id, deviation.Title);

        return ToDto(deviation);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public async Task<DeviationDto?> UpdateAsync(
        UpdateDeviationCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Title, nameof(command.Title));
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Description, nameof(command.Description));

        var existing = await repository.GetByIdAsync(command.Id, cancellationToken)
            .ConfigureAwait(false);

        if (existing is null)
        {
            logger.LogWarning("Deviation {Id} not found for update", command.Id);
            return null;
        }

        var now = timeProvider.GetUtcNow();

        var updated = existing.UpdateDetails(
            title: command.Title,
            description: command.Description,
            severity: command.Severity,
            status: command.Status,
            lastModifiedAtUtc: now);

        await repository.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);

        logger.LogInformation("Updated deviation {Id}", updated.Id);

        return ToDto(updated);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public async Task<bool> DeleteAsync(
        DeleteDeviationCommand command,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Deleting deviation {Id}", command.Id);

        var deleted = await repository.DeleteAsync(command.Id, cancellationToken)
            .ConfigureAwait(false);

        if (!deleted)
            logger.LogWarning("Deviation {Id} not found for deletion", command.Id);

        return deleted;
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static DeviationDto ToDto(Deviation d) => new(
        Id: d.Id,
        Title: d.Title,
        Description: d.Description,
        Severity: d.Severity.ToString(),
        Status: d.Status.ToString(),
        CreatedAtUtc: d.CreatedAtUtc,
        LastModifiedAtUtc: d.LastModifiedAtUtc);
}
