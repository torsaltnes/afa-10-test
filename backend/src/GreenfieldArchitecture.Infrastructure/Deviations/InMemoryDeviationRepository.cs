using System.Collections.Concurrent;
using GreenfieldArchitecture.Application.Abstractions.Deviations;
using GreenfieldArchitecture.Domain.Deviations;

namespace GreenfieldArchitecture.Infrastructure.Deviations;

/// <summary>
/// Thread-safe in-memory implementation of <see cref="IDeviationRepository"/>.
/// Registered as a singleton; data persists only for the lifetime of the process.
/// </summary>
public sealed class InMemoryDeviationRepository : IDeviationRepository
{
    private readonly ConcurrentDictionary<Guid, Deviation> _store = new();

    public Task<IReadOnlyList<Deviation>> ListAsync(CancellationToken cancellationToken = default)
    {
        // Snapshot the values so the caller always gets a stable, order-consistent list.
        IReadOnlyList<Deviation> snapshot = [.. _store.Values];
        return Task.FromResult(snapshot);
    }

    public Task<Deviation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _store.TryGetValue(id, out var deviation);
        return Task.FromResult(deviation);
    }

    public Task AddAsync(Deviation deviation, CancellationToken cancellationToken = default)
    {
        _store[deviation.Id] = deviation;
        return Task.CompletedTask;
    }

    public Task<bool> UpdateAsync(Deviation deviation, CancellationToken cancellationToken = default)
    {
        if (!_store.ContainsKey(deviation.Id))
            return Task.FromResult(false);

        _store[deviation.Id] = deviation;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var removed = _store.TryRemove(id, out _);
        return Task.FromResult(removed);
    }

    /// <summary>
    /// Removes all entries. Used only by integration-test infrastructure — not part of <see cref="IDeviationRepository"/>.
    /// </summary>
    public void Clear() => _store.Clear();
}
