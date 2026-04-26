using GreenfieldArchitecture.Application.Deviations.Commands;
using GreenfieldArchitecture.Application.Deviations.Dtos;
using GreenfieldArchitecture.Application.Deviations.Queries;

namespace GreenfieldArchitecture.Application.Abstractions.Deviations;

/// <summary>
/// Use-case abstraction for the deviation domain, consumed by Minimal API handlers.
/// </summary>
public interface IDeviationService
{
    Task<IReadOnlyList<DeviationDto>> ListAsync(
        ListDeviationsQuery query,
        CancellationToken cancellationToken = default);

    Task<DeviationDto?> GetByIdAsync(
        GetDeviationByIdQuery query,
        CancellationToken cancellationToken = default);

    Task<DeviationDto> CreateAsync(
        CreateDeviationCommand command,
        CancellationToken cancellationToken = default);

    Task<DeviationDto?> UpdateAsync(
        UpdateDeviationCommand command,
        CancellationToken cancellationToken = default);

    /// <returns><c>true</c> when deleted; <c>false</c> when not found.</returns>
    Task<bool> DeleteAsync(
        DeleteDeviationCommand command,
        CancellationToken cancellationToken = default);
}
