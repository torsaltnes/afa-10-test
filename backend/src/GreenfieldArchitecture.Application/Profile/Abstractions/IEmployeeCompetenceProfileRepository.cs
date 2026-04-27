using GreenfieldArchitecture.Domain.Profile;

namespace GreenfieldArchitecture.Application.Profile.Abstractions;

/// <summary>
/// Persistence contract for the employee competence profile aggregate.
/// </summary>
public interface IEmployeeCompetenceProfileRepository
{
    Task<EmployeeCompetenceProfile?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<EmployeeCompetenceProfile> SaveAsync(EmployeeCompetenceProfile profile, CancellationToken cancellationToken = default);

    Task<EducationEntry> AddEducationAsync(EducationEntry entry, CancellationToken cancellationToken = default);
    Task<EducationEntry?> GetEducationAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<EducationEntry?> UpdateEducationAsync(EducationEntry entry, CancellationToken cancellationToken = default);
    Task<bool> DeleteEducationAsync(Guid id, string userId, CancellationToken cancellationToken = default);

    Task<CertificateEntry> AddCertificateAsync(CertificateEntry entry, CancellationToken cancellationToken = default);
    Task<CertificateEntry?> GetCertificateAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<CertificateEntry?> UpdateCertificateAsync(CertificateEntry entry, CancellationToken cancellationToken = default);
    Task<bool> DeleteCertificateAsync(Guid id, string userId, CancellationToken cancellationToken = default);

    Task<CourseEntry> AddCourseAsync(CourseEntry entry, CancellationToken cancellationToken = default);
    Task<CourseEntry?> GetCourseAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<CourseEntry?> UpdateCourseAsync(CourseEntry entry, CancellationToken cancellationToken = default);
    Task<bool> DeleteCourseAsync(Guid id, string userId, CancellationToken cancellationToken = default);
}
