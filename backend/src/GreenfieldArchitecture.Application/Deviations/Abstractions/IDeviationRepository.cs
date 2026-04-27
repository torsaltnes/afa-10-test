using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Deviations.Abstractions;

/// <summary>
/// Persistence contract for deviations.
/// </summary>
public interface IDeviationRepository
{
    Task<IReadOnlyList<Deviation>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Deviation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Deviation> AddAsync(Deviation deviation, CancellationToken cancellationToken = default);
    Task<Deviation?> UpdateAsync(Deviation deviation, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
