using System.Collections.Concurrent;
using GreenfieldArchitecture.Application.Profile.Abstractions;
using GreenfieldArchitecture.Domain.Profile;

namespace GreenfieldArchitecture.Infrastructure.Profile.Repositories;

/// <summary>
/// Thread-safe in-memory implementation of IEmployeeCompetenceProfileRepository.
/// Data does not persist across application restarts.
/// </summary>
public sealed class InMemoryEmployeeCompetenceProfileRepository : IEmployeeCompetenceProfileRepository
{
    private readonly ConcurrentDictionary<string, EmployeeCompetenceProfile> _profiles = new();
    private readonly ConcurrentDictionary<Guid, EducationEntry> _education = new();
    private readonly ConcurrentDictionary<Guid, CertificateEntry> _certificates = new();
    private readonly ConcurrentDictionary<Guid, CourseEntry> _courses = new();

    // ── Profile ──────────────────────────────────────────────────────────────

    public Task<EmployeeCompetenceProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        _profiles.TryGetValue(userId, out var profile);

        if (profile is not null)
        {
            // Hydrate the child collections on every read so callers see the live data.
            profile.EducationEntries.Clear();
            profile.EducationEntries.AddRange(_education.Values.Where(e => e.UserId == userId).OrderBy(e => e.GraduationYear));

            profile.CertificateEntries.Clear();
            profile.CertificateEntries.AddRange(_certificates.Values.Where(c => c.UserId == userId).OrderBy(c => c.DateEarned));

            profile.CourseEntries.Clear();
            profile.CourseEntries.AddRange(_courses.Values.Where(c => c.UserId == userId).OrderBy(c => c.CompletionDate));
        }

        return Task.FromResult(profile);
    }

    public Task<EmployeeCompetenceProfile> SaveAsync(EmployeeCompetenceProfile profile, CancellationToken cancellationToken = default)
    {
        _profiles[profile.UserId] = profile;
        return Task.FromResult(profile);
    }

    // ── Education ────────────────────────────────────────────────────────────

    public Task<EducationEntry> AddEducationAsync(EducationEntry entry, CancellationToken cancellationToken = default)
    {
        _education[entry.Id] = entry;
        return Task.FromResult(entry);
    }

    public Task<EducationEntry?> GetEducationAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        _education.TryGetValue(id, out var entry);
        var result = entry?.UserId == userId ? entry : null;
        return Task.FromResult(result);
    }

    public Task<EducationEntry?> UpdateEducationAsync(EducationEntry entry, CancellationToken cancellationToken = default)
    {
        if (!_education.ContainsKey(entry.Id)) return Task.FromResult<EducationEntry?>(null);
        _education[entry.Id] = entry;
        return Task.FromResult<EducationEntry?>(entry);
    }

    public Task<bool> DeleteEducationAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        if (!_education.TryGetValue(id, out var entry) || entry.UserId != userId)
            return Task.FromResult(false);
        return Task.FromResult(_education.TryRemove(id, out _));
    }

    // ── Certificates ─────────────────────────────────────────────────────────

    public Task<CertificateEntry> AddCertificateAsync(CertificateEntry entry, CancellationToken cancellationToken = default)
    {
        _certificates[entry.Id] = entry;
        return Task.FromResult(entry);
    }

    public Task<CertificateEntry?> GetCertificateAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        _certificates.TryGetValue(id, out var entry);
        var result = entry?.UserId == userId ? entry : null;
        return Task.FromResult(result);
    }

    public Task<CertificateEntry?> UpdateCertificateAsync(CertificateEntry entry, CancellationToken cancellationToken = default)
    {
        if (!_certificates.ContainsKey(entry.Id)) return Task.FromResult<CertificateEntry?>(null);
        _certificates[entry.Id] = entry;
        return Task.FromResult<CertificateEntry?>(entry);
    }

    public Task<bool> DeleteCertificateAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        if (!_certificates.TryGetValue(id, out var entry) || entry.UserId != userId)
            return Task.FromResult(false);
        return Task.FromResult(_certificates.TryRemove(id, out _));
    }

    // ── Courses ──────────────────────────────────────────────────────────────

    public Task<CourseEntry> AddCourseAsync(CourseEntry entry, CancellationToken cancellationToken = default)
    {
        _courses[entry.Id] = entry;
        return Task.FromResult(entry);
    }

    public Task<CourseEntry?> GetCourseAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        _courses.TryGetValue(id, out var entry);
        var result = entry?.UserId == userId ? entry : null;
        return Task.FromResult(result);
    }

    public Task<CourseEntry?> UpdateCourseAsync(CourseEntry entry, CancellationToken cancellationToken = default)
    {
        if (!_courses.ContainsKey(entry.Id)) return Task.FromResult<CourseEntry?>(null);
        _courses[entry.Id] = entry;
        return Task.FromResult<CourseEntry?>(entry);
    }

    public Task<bool> DeleteCourseAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        if (!_courses.TryGetValue(id, out var entry) || entry.UserId != userId)
            return Task.FromResult(false);
        return Task.FromResult(_courses.TryRemove(id, out _));
    }
}
