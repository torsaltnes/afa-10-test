using GreenfieldArchitecture.Application.Deviations.Abstractions;
using GreenfieldArchitecture.Application.Deviations.Contracts;
using GreenfieldArchitecture.Application.Deviations.Mappings;
using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Services;

/// <summary>
/// Orchestrates CRUD operations for deviations, applying validation and timestamps.
/// </summary>
public sealed class DeviationService(
    IDeviationRepository repository,
    TimeProvider timeProvider) : IDeviationService
{
    public async Task<IReadOnlyList<DeviationDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var deviations = await repository.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return [.. deviations.Select(d => d.ToDto())];
    }

    public async Task<DeviationDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deviation = await repository.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        return deviation?.ToDto();
    }

    public async Task<DeviationDto> CreateAsync(
        CreateDeviationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Title);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Description);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ReportedBy);

        if (!Enum.IsDefined(request.Severity))
            throw new ArgumentException($"Invalid severity value: {request.Severity}", nameof(request));

        if (!Enum.IsDefined(request.Status))
            throw new ArgumentException($"Invalid status value: {request.Status}", nameof(request));

        var now = timeProvider.GetUtcNow();
        var deviation = new Deviation
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Severity = request.Severity,
            Status = request.Status,
            ReportedBy = request.ReportedBy,
            ReportedAt = now,
            UpdatedAt = now,
        };

        var created = await repository.AddAsync(deviation, cancellationToken).ConfigureAwait(false);
        return created.ToDto();
    }

    public async Task<DeviationDto?> UpdateAsync(
        Guid id,
        UpdateDeviationRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Title);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Description);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ReportedBy);

        if (!Enum.IsDefined(request.Severity))
            throw new ArgumentException($"Invalid severity value: {request.Severity}", nameof(request));

        if (!Enum.IsDefined(request.Status))
            throw new ArgumentException($"Invalid status value: {request.Status}", nameof(request));

        var existing = await repository.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        if (existing is null) return null;

        existing.Title = request.Title;
        existing.Description = request.Description;
        existing.Severity = request.Severity;
        existing.Status = request.Status;
        existing.ReportedBy = request.ReportedBy;
        existing.UpdatedAt = timeProvider.GetUtcNow();

        var updated = await repository.UpdateAsync(existing, cancellationToken).ConfigureAwait(false);
        return updated?.ToDto();
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default) =>
        await repository.DeleteAsync(id, cancellationToken).ConfigureAwait(false);
}
