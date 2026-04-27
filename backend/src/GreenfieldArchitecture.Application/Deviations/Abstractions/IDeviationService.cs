using GreenfieldArchitecture.Application.Deviations.Contracts;

namespace GreenfieldArchitecture.Application.Deviations.Abstractions;

/// <summary>
/// Application-level CRUD operations for deviations.
/// </summary>
public interface IDeviationService
{
    Task<IReadOnlyList<DeviationDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<DeviationDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DeviationDto> CreateAsync(CreateDeviationRequest request, CancellationToken cancellationToken = default);
    Task<DeviationDto?> UpdateAsync(Guid id, UpdateDeviationRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
