using System.Collections.Concurrent;
using Greenfield.Application.Abstractions;
using Greenfield.Domain.Deviations;

namespace Greenfield.Infrastructure.Deviations;

/// <summary>
/// Thread-safe, singleton in-memory store for <see cref="Deviation"/> aggregates.
/// Seeded with representative mock data on first construction.
/// </summary>
public sealed class InMemoryDeviationRepository : IDeviationRepository
{
    private readonly ConcurrentDictionary<Guid, Deviation> _store;

    public InMemoryDeviationRepository()
    {
        _store = new ConcurrentDictionary<Guid, Deviation>();
        DeviationSeedData.Seed(_store);
    }

    public Task<IReadOnlyList<Deviation>> GetAllAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<Deviation>>([.. _store.Values]);

    public Task<Deviation?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        _store.TryGetValue(id, out var deviation);
        return Task.FromResult(deviation);
    }

    public Task<Deviation> AddAsync(Deviation deviation, CancellationToken ct = default)
    {
        _store[deviation.Id] = deviation;
        return Task.FromResult(deviation);
    }

    public Task<Deviation> UpdateAsync(Deviation deviation, CancellationToken ct = default)
    {
        _store[deviation.Id] = deviation;
        return Task.FromResult(deviation);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
        => Task.FromResult(_store.TryRemove(id, out _));
}
