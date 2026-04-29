using Greenfield.Domain.Deviations;

namespace Greenfield.Application.Abstractions;

/// <summary>Pure data-access contract for <see cref="Deviation"/> aggregates.</summary>
public interface IDeviationRepository
{
    Task<IReadOnlyList<Deviation>> GetAllAsync(CancellationToken ct = default);
    Task<Deviation?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Deviation> AddAsync(Deviation deviation, CancellationToken ct = default);
    Task<Deviation> UpdateAsync(Deviation deviation, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}
