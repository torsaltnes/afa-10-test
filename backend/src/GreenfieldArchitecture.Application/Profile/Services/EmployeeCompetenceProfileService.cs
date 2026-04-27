using GreenfieldArchitecture.Application.Profile.Abstractions;
using GreenfieldArchitecture.Application.Profile.Contracts;
using GreenfieldArchitecture.Application.Profile.Mappings;
using GreenfieldArchitecture.Domain.Profile;

namespace GreenfieldArchitecture.Application.Profile.Services;

/// <summary>
/// Orchestrates CRUD operations for the employee competence profile,
/// applying field validation and enforcing ownership before persistence.
/// </summary>
public sealed class EmployeeCompetenceProfileService(
    IEmployeeCompetenceProfileRepository repository,
    ICurrentUserContext currentUser,
    TimeProvider timeProvider) : IEmployeeCompetenceProfileService
{
    // ── Profile ──────────────────────────────────────────────────────────────

    public async Task<CompetenceProfileDto> GetMyProfileAsync(CancellationToken cancellationToken = default)
    {
        var profile = await GetOrCreateProfileAsync(cancellationToken).ConfigureAwait(false);
        return profile.ToDto();
    }

    // ── Education ────────────────────────────────────────────────────────────

    public async Task<EducationEntryDto> AddEducationAsync(
        CreateEducationRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateEducation(request.Degree, request.Institution, request.GraduationYear);

        await EnsureProfileExistsAsync(cancellationToken).ConfigureAwait(false);

        var entry = new EducationEntry
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            Degree = request.Degree.Trim(),
            Institution = request.Institution.Trim(),
            GraduationYear = request.GraduationYear,
        };

        var created = await repository.AddEducationAsync(entry, cancellationToken).ConfigureAwait(false);
        await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return created.ToDto();
    }

    public async Task<EducationEntryDto?> UpdateEducationAsync(
        Guid id,
        UpdateEducationRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateEducation(request.Degree, request.Institution, request.GraduationYear);

        var existing = await repository.GetEducationAsync(id, currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (existing is null) return null;

        existing.Degree = request.Degree.Trim();
        existing.Institution = request.Institution.Trim();
        existing.GraduationYear = request.GraduationYear;

        var updated = await repository.UpdateEducationAsync(existing, cancellationToken).ConfigureAwait(false);
        if (updated is not null) await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return updated?.ToDto();
    }

    public async Task<bool> DeleteEducationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteEducationAsync(id, currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (deleted) await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return deleted;
    }

    // ── Certificates ─────────────────────────────────────────────────────────

    public async Task<CertificateEntryDto> AddCertificateAsync(
        CreateCertificateRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCertificate(request.CertificateName, request.IssuingOrganization, request.DateEarned);

        await EnsureProfileExistsAsync(cancellationToken).ConfigureAwait(false);

        var entry = new CertificateEntry
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            CertificateName = request.CertificateName.Trim(),
            IssuingOrganization = request.IssuingOrganization.Trim(),
            DateEarned = request.DateEarned,
        };

        var created = await repository.AddCertificateAsync(entry, cancellationToken).ConfigureAwait(false);
        await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return created.ToDto();
    }

    public async Task<CertificateEntryDto?> UpdateCertificateAsync(
        Guid id,
        UpdateCertificateRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCertificate(request.CertificateName, request.IssuingOrganization, request.DateEarned);

        var existing = await repository.GetCertificateAsync(id, currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (existing is null) return null;

        existing.CertificateName = request.CertificateName.Trim();
        existing.IssuingOrganization = request.IssuingOrganization.Trim();
        existing.DateEarned = request.DateEarned;

        var updated = await repository.UpdateCertificateAsync(existing, cancellationToken).ConfigureAwait(false);
        if (updated is not null) await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return updated?.ToDto();
    }

    public async Task<bool> DeleteCertificateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteCertificateAsync(id, currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (deleted) await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return deleted;
    }

    // ── Courses ──────────────────────────────────────────────────────────────

    public async Task<CourseEntryDto> AddCourseAsync(
        CreateCourseRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCourse(request.CourseName, request.Provider, request.CompletionDate);

        await EnsureProfileExistsAsync(cancellationToken).ConfigureAwait(false);

        var entry = new CourseEntry
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            CourseName = request.CourseName.Trim(),
            Provider = request.Provider.Trim(),
            CompletionDate = request.CompletionDate,
        };

        var created = await repository.AddCourseAsync(entry, cancellationToken).ConfigureAwait(false);
        await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return created.ToDto();
    }

    public async Task<CourseEntryDto?> UpdateCourseAsync(
        Guid id,
        UpdateCourseRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateCourse(request.CourseName, request.Provider, request.CompletionDate);

        var existing = await repository.GetCourseAsync(id, currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (existing is null) return null;

        existing.CourseName = request.CourseName.Trim();
        existing.Provider = request.Provider.Trim();
        existing.CompletionDate = request.CompletionDate;

        var updated = await repository.UpdateCourseAsync(existing, cancellationToken).ConfigureAwait(false);
        if (updated is not null) await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return updated?.ToDto();
    }

    public async Task<bool> DeleteCourseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteCourseAsync(id, currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (deleted) await TouchProfileAsync(cancellationToken).ConfigureAwait(false);
        return deleted;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<EmployeeCompetenceProfile> GetOrCreateProfileAsync(CancellationToken cancellationToken)
    {
        var profile = await repository.GetByUserIdAsync(currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (profile is not null) return profile;

        var newProfile = new EmployeeCompetenceProfile
        {
            UserId = currentUser.UserId,
            LastUpdatedUtc = timeProvider.GetUtcNow(),
        };
        return await repository.SaveAsync(newProfile, cancellationToken).ConfigureAwait(false);
    }

    private async Task EnsureProfileExistsAsync(CancellationToken cancellationToken) =>
        await GetOrCreateProfileAsync(cancellationToken).ConfigureAwait(false);

    private async Task TouchProfileAsync(CancellationToken cancellationToken)
    {
        var profile = await repository.GetByUserIdAsync(currentUser.UserId, cancellationToken).ConfigureAwait(false);
        if (profile is null) return;

        profile.LastUpdatedUtc = timeProvider.GetUtcNow();
        await repository.SaveAsync(profile, cancellationToken).ConfigureAwait(false);
    }

    // ── Validation ────────────────────────────────────────────────────────────

    private static void ValidateEducation(string degree, string institution, int graduationYear)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(degree, nameof(degree));
        ArgumentException.ThrowIfNullOrWhiteSpace(institution, nameof(institution));

        if (degree.Length > 200)
            throw new ArgumentException("Degree must not exceed 200 characters.", nameof(degree));

        if (institution.Length > 200)
            throw new ArgumentException("Institution must not exceed 200 characters.", nameof(institution));

        var currentYear = DateTime.UtcNow.Year;
        if (graduationYear < 1900 || graduationYear > currentYear + 1)
            throw new ArgumentException(
                $"GraduationYear must be between 1900 and {currentYear + 1}.",
                nameof(graduationYear));
    }

    private static void ValidateCertificate(string certificateName, string issuingOrganization, DateOnly dateEarned)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(certificateName, nameof(certificateName));
        ArgumentException.ThrowIfNullOrWhiteSpace(issuingOrganization, nameof(issuingOrganization));

        if (certificateName.Length > 200)
            throw new ArgumentException("CertificateName must not exceed 200 characters.", nameof(certificateName));

        if (issuingOrganization.Length > 200)
            throw new ArgumentException("IssuingOrganization must not exceed 200 characters.", nameof(issuingOrganization));

        if (dateEarned > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ArgumentException("DateEarned cannot be in the future.", nameof(dateEarned));
    }

    private static void ValidateCourse(string courseName, string provider, DateOnly completionDate)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(courseName, nameof(courseName));
        ArgumentException.ThrowIfNullOrWhiteSpace(provider, nameof(provider));

        if (courseName.Length > 200)
            throw new ArgumentException("CourseName must not exceed 200 characters.", nameof(courseName));

        if (provider.Length > 200)
            throw new ArgumentException("Provider must not exceed 200 characters.", nameof(provider));

        if (completionDate > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ArgumentException("CompletionDate cannot be in the future.", nameof(completionDate));
    }
}
