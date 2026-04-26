using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Application.Abstractions.Deviations;

/// <summary>
/// Persistence abstraction for the deviation store.
/// Infrastructure provides a concrete singleton implementation.
/// </summary>
public interface IDeviationRepository
{
    Task<IReadOnlyList<Deviation>> ListAsync(CancellationToken cancellationToken = default);

    Task<Deviation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(Deviation deviation, CancellationToken cancellationToken = default);

    /// <returns><c>true</c> when the deviation existed and was replaced; <c>false</c> when not found.</returns>
    Task<bool> UpdateAsync(Deviation deviation, CancellationToken cancellationToken = default);

    /// <returns><c>true</c> when the deviation existed and was removed; <c>false</c> when not found.</returns>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
