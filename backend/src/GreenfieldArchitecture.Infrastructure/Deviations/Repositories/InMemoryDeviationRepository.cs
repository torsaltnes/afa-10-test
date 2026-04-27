using System.Collections.Concurrent;
using GreenfieldArchitecture.Application.Deviations.Abstractions;
using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Infrastructure.Deviations.Repositories;

/// <summary>
/// Thread-safe in-memory implementation of IDeviationRepository.
/// Data does not persist across application restarts.
/// </summary>
public sealed class InMemoryDeviationRepository : IDeviationRepository
{
    private readonly ConcurrentDictionary<Guid, Deviation> _store = new();

    public Task<IReadOnlyList<Deviation>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<Deviation> result = [.. _store.Values.OrderByDescending(d => d.UpdatedAt)];
        return Task.FromResult(result);
    }

    public Task<Deviation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _store.TryGetValue(id, out var deviation);
        return Task.FromResult(deviation);
    }

    public Task<Deviation> AddAsync(Deviation deviation, CancellationToken cancellationToken = default)
    {
        _store[deviation.Id] = deviation;
        return Task.FromResult(deviation);
    }

    public Task<Deviation?> UpdateAsync(Deviation deviation, CancellationToken cancellationToken = default)
    {
        _store[deviation.Id] = deviation;
        return Task.FromResult<Deviation?>(deviation);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var removed = _store.TryRemove(id, out _);
        return Task.FromResult(removed);
    }
}
