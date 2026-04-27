using GreenfieldArchitecture.Application.Profile.Contracts;

namespace GreenfieldArchitecture.Application.Profile.Abstractions;

/// <summary>
/// Application-layer contract for managing the employee competence profile.
/// </summary>
public interface IEmployeeCompetenceProfileService
{
    Task<CompetenceProfileDto> GetMyProfileAsync(CancellationToken cancellationToken = default);

    Task<EducationEntryDto> AddEducationAsync(CreateEducationRequest request, CancellationToken cancellationToken = default);
    Task<EducationEntryDto?> UpdateEducationAsync(Guid id, UpdateEducationRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteEducationAsync(Guid id, CancellationToken cancellationToken = default);

    Task<CertificateEntryDto> AddCertificateAsync(CreateCertificateRequest request, CancellationToken cancellationToken = default);
    Task<CertificateEntryDto?> UpdateCertificateAsync(Guid id, UpdateCertificateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCertificateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<CourseEntryDto> AddCourseAsync(CreateCourseRequest request, CancellationToken cancellationToken = default);
    Task<CourseEntryDto?> UpdateCourseAsync(Guid id, UpdateCourseRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCourseAsync(Guid id, CancellationToken cancellationToken = default);
}
