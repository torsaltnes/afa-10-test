using FluentAssertions;
using GreenfieldArchitecture.Application.Profile.Abstractions;
using GreenfieldArchitecture.Application.Profile.Contracts;
using GreenfieldArchitecture.Application.Profile.Services;
using GreenfieldArchitecture.Domain.Profile;
using Moq;
using Xunit;

namespace GreenfieldArchitecture.Application.Tests.Profile;

public sealed class EmployeeCompetenceProfileServiceTests
{
    private static readonly DateTimeOffset FixedUtcNow =
        new(2024, 9, 1, 10, 0, 0, TimeSpan.Zero);

    private static readonly DateOnly PastDate = new(2023, 6, 15);
    private static readonly DateOnly FutureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));

    private readonly Mock<IEmployeeCompetenceProfileRepository> _repoMock;
    private readonly Mock<ICurrentUserContext> _userMock;
    private readonly Mock<TimeProvider> _timeProviderMock;
    private readonly EmployeeCompetenceProfileService _sut;

    private const string UserId = "employee-001";

    public EmployeeCompetenceProfileServiceTests()
    {
        _repoMock = new Mock<IEmployeeCompetenceProfileRepository>(MockBehavior.Strict);
        _userMock = new Mock<ICurrentUserContext>(MockBehavior.Strict);
        _userMock.Setup(u => u.UserId).Returns(UserId);

        _timeProviderMock = new Mock<TimeProvider>();
        _timeProviderMock
            .Setup(tp => tp.GetUtcNow())
            .Returns(FixedUtcNow);

        _sut = new EmployeeCompetenceProfileService(
            _repoMock.Object,
            _userMock.Object,
            _timeProviderMock.Object);
    }

    // ── GetMyProfileAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task GetMyProfileAsync_ReturnsExistingProfile()
    {
        // Arrange
        var profile = MakeProfile();
        _repoMock.Setup(r => r.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(profile);

        // Act
        var result = await _sut.GetMyProfileAsync();

        // Assert
        result.UserId.Should().Be(UserId);
        result.EducationEntries.Should().BeEmpty();
        result.CertificateEntries.Should().BeEmpty();
        result.CourseEntries.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMyProfileAsync_WhenNoProfile_CreatesAndReturnsNew()
    {
        // Arrange
        var newProfile = MakeProfile();
        _repoMock.Setup(r => r.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((EmployeeCompetenceProfile?)null);
        _repoMock.Setup(r => r.SaveAsync(It.IsAny<EmployeeCompetenceProfile>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((EmployeeCompetenceProfile p, CancellationToken _) => p);

        // Act
        var result = await _sut.GetMyProfileAsync();

        // Assert
        result.UserId.Should().Be(UserId);
        _repoMock.Verify(r => r.SaveAsync(It.IsAny<EmployeeCompetenceProfile>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── AddEducationAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task AddEducationAsync_ValidRequest_ReturnsDto()
    {
        // Arrange
        var request = new CreateEducationRequest("Bachelor of Science", "MIT", 2015);
        SetupProfileExists();
        _repoMock.Setup(r => r.AddEducationAsync(It.IsAny<EducationEntry>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((EducationEntry e, CancellationToken _) => e);
        SetupTouchProfile();

        // Act
        var result = await _sut.AddEducationAsync(request);

        // Assert
        result.Degree.Should().Be("Bachelor of Science");
        result.Institution.Should().Be("MIT");
        result.GraduationYear.Should().Be(2015);
        result.Id.Should().NotBe(Guid.Empty);
    }

    [Theory]
    [InlineData("", "MIT", 2015)]
    [InlineData("BSc", "", 2015)]
    public async Task AddEducationAsync_BlankRequiredField_ThrowsArgumentException(
        string degree, string institution, int year)
    {
        var act = () => _sut.AddEducationAsync(new CreateEducationRequest(degree, institution, year));
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Theory]
    [InlineData(1899)]
    [InlineData(3000)]
    public async Task AddEducationAsync_InvalidYear_ThrowsArgumentException(int year)
    {
        var act = () => _sut.AddEducationAsync(new CreateEducationRequest("BSc", "MIT", year));
        await act.Should().ThrowAsync<ArgumentException>();
    }

    // ── UpdateEducationAsync ─────────────────────────────────────────────────

    [Fact]
    public async Task UpdateEducationAsync_WhenFound_ReturnsUpdatedDto()
    {
        // Arrange
        var existing = MakeEducationEntry();
        var request = new UpdateEducationRequest("MSc", "Harvard", 2020);

        _repoMock.Setup(r => r.GetEducationAsync(existing.Id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(existing);
        _repoMock.Setup(r => r.UpdateEducationAsync(existing, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(existing);
        SetupTouchProfile();

        // Act
        var result = await _sut.UpdateEducationAsync(existing.Id, request);

        // Assert
        result.Should().NotBeNull();
        result!.Degree.Should().Be("MSc");
        result.Institution.Should().Be("Harvard");
        result.GraduationYear.Should().Be(2020);
    }

    [Fact]
    public async Task UpdateEducationAsync_WhenNotFound_ReturnsNull()
    {
        // Arrange
        var missingId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetEducationAsync(missingId, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((EducationEntry?)null);

        // Act
        var result = await _sut.UpdateEducationAsync(missingId, new UpdateEducationRequest("BSc", "MIT", 2015));

        // Assert
        result.Should().BeNull();
    }

    // ── DeleteEducationAsync ─────────────────────────────────────────────────

    [Fact]
    public async Task DeleteEducationAsync_WhenExists_ReturnsTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.DeleteEducationAsync(id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(true);
        SetupTouchProfile();

        // Act
        var result = await _sut.DeleteEducationAsync(id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteEducationAsync_WhenNotFound_ReturnsFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.DeleteEducationAsync(id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(false);

        // Act
        var result = await _sut.DeleteEducationAsync(id);

        // Assert
        result.Should().BeFalse();
    }

    // ── AddCertificateAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task AddCertificateAsync_ValidRequest_ReturnsDto()
    {
        // Arrange
        var request = new CreateCertificateRequest("AWS Solutions Architect", "Amazon", PastDate);
        SetupProfileExists();
        _repoMock.Setup(r => r.AddCertificateAsync(It.IsAny<CertificateEntry>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((CertificateEntry e, CancellationToken _) => e);
        SetupTouchProfile();

        // Act
        var result = await _sut.AddCertificateAsync(request);

        // Assert
        result.CertificateName.Should().Be("AWS Solutions Architect");
        result.IssuingOrganization.Should().Be("Amazon");
        result.DateEarned.Should().Be(PastDate);
    }

    [Theory]
    [InlineData("", "Amazon")]
    [InlineData("AWS SA", "")]
    public async Task AddCertificateAsync_BlankRequiredField_ThrowsArgumentException(
        string name, string org)
    {
        var act = () => _sut.AddCertificateAsync(new CreateCertificateRequest(name, org, PastDate));
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task AddCertificateAsync_FutureDateEarned_ThrowsArgumentException()
    {
        var act = () => _sut.AddCertificateAsync(new CreateCertificateRequest("AWS SA", "Amazon", FutureDate));
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*future*");
    }

    // ── UpdateCertificateAsync ───────────────────────────────────────────────

    [Fact]
    public async Task UpdateCertificateAsync_WhenFound_ReturnsUpdatedDto()
    {
        // Arrange
        var existing = MakeCertificateEntry();
        var request = new UpdateCertificateRequest("Azure Expert", "Microsoft", PastDate);

        _repoMock.Setup(r => r.GetCertificateAsync(existing.Id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(existing);
        _repoMock.Setup(r => r.UpdateCertificateAsync(existing, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(existing);
        SetupTouchProfile();

        // Act
        var result = await _sut.UpdateCertificateAsync(existing.Id, request);

        // Assert
        result.Should().NotBeNull();
        result!.CertificateName.Should().Be("Azure Expert");
    }

    [Fact]
    public async Task UpdateCertificateAsync_WhenNotFound_ReturnsNull()
    {
        // Arrange
        var missingId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetCertificateAsync(missingId, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((CertificateEntry?)null);

        var result = await _sut.UpdateCertificateAsync(missingId, new UpdateCertificateRequest("X", "Y", PastDate));
        result.Should().BeNull();
    }

    // ── DeleteCertificateAsync ───────────────────────────────────────────────

    [Fact]
    public async Task DeleteCertificateAsync_WhenExists_ReturnsTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.DeleteCertificateAsync(id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(true);
        SetupTouchProfile();

        var result = await _sut.DeleteCertificateAsync(id);
        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteCertificateAsync_WhenNotFound_ReturnsFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.DeleteCertificateAsync(id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(false);

        var result = await _sut.DeleteCertificateAsync(id);
        result.Should().BeFalse();
    }

    // ── AddCourseAsync ───────────────────────────────────────────────────────

    [Fact]
    public async Task AddCourseAsync_ValidRequest_ReturnsDto()
    {
        // Arrange
        var request = new CreateCourseRequest("Docker Fundamentals", "Udemy", PastDate);
        SetupProfileExists();
        _repoMock.Setup(r => r.AddCourseAsync(It.IsAny<CourseEntry>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((CourseEntry e, CancellationToken _) => e);
        SetupTouchProfile();

        // Act
        var result = await _sut.AddCourseAsync(request);

        // Assert
        result.CourseName.Should().Be("Docker Fundamentals");
        result.Provider.Should().Be("Udemy");
        result.CompletionDate.Should().Be(PastDate);
    }

    [Theory]
    [InlineData("", "Udemy")]
    [InlineData("Docker", "")]
    public async Task AddCourseAsync_BlankRequiredField_ThrowsArgumentException(
        string name, string provider)
    {
        var act = () => _sut.AddCourseAsync(new CreateCourseRequest(name, provider, PastDate));
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task AddCourseAsync_FutureCompletionDate_ThrowsArgumentException()
    {
        var act = () => _sut.AddCourseAsync(new CreateCourseRequest("Docker", "Udemy", FutureDate));
        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*future*");
    }

    // ── UpdateCourseAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateCourseAsync_WhenFound_ReturnsUpdatedDto()
    {
        // Arrange
        var existing = MakeCourseEntry();
        var request = new UpdateCourseRequest("Kubernetes Advanced", "Pluralsight", PastDate);

        _repoMock.Setup(r => r.GetCourseAsync(existing.Id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(existing);
        _repoMock.Setup(r => r.UpdateCourseAsync(existing, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(existing);
        SetupTouchProfile();

        // Act
        var result = await _sut.UpdateCourseAsync(existing.Id, request);

        // Assert
        result.Should().NotBeNull();
        result!.CourseName.Should().Be("Kubernetes Advanced");
    }

    [Fact]
    public async Task UpdateCourseAsync_WhenNotFound_ReturnsNull()
    {
        // Arrange
        var missingId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetCourseAsync(missingId, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((CourseEntry?)null);

        var result = await _sut.UpdateCourseAsync(missingId, new UpdateCourseRequest("X", "Y", PastDate));
        result.Should().BeNull();
    }

    // ── DeleteCourseAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteCourseAsync_WhenExists_ReturnsTrue()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.DeleteCourseAsync(id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(true);
        SetupTouchProfile();

        var result = await _sut.DeleteCourseAsync(id);
        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteCourseAsync_WhenNotFound_ReturnsFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.DeleteCourseAsync(id, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(false);

        var result = await _sut.DeleteCourseAsync(id);
        result.Should().BeFalse();
    }

    // ── Ownership enforcement ────────────────────────────────────────────────

    [Fact]
    public async Task UpdateEducationAsync_EntryBelongingToAnotherUser_ReturnsNull()
    {
        // Arrange — repo returns null because user id doesn't match (ownership check in repo)
        var otherId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetEducationAsync(otherId, UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync((EducationEntry?)null);

        var result = await _sut.UpdateEducationAsync(otherId, new UpdateEducationRequest("BSc", "MIT", 2015));
        result.Should().BeNull();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static EmployeeCompetenceProfile MakeProfile() =>
        new()
        {
            UserId = UserId,
            LastUpdatedUtc = FixedUtcNow,
        };

    private static EducationEntry MakeEducationEntry() =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Degree = "BSc Computer Science",
            Institution = "University of Test",
            GraduationYear = 2018,
        };

    private static CertificateEntry MakeCertificateEntry() =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            CertificateName = "Test Cert",
            IssuingOrganization = "Test Org",
            DateEarned = PastDate,
        };

    private static CourseEntry MakeCourseEntry() =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            CourseName = "Test Course",
            Provider = "Test Provider",
            CompletionDate = PastDate,
        };

    /// <summary>Sets up the repo to return an existing profile and accept a save (for touch).</summary>
    private void SetupProfileExists()
    {
        var profile = MakeProfile();
        _repoMock.Setup(r => r.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(profile);
        _repoMock.Setup(r => r.SaveAsync(It.IsAny<EmployeeCompetenceProfile>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((EmployeeCompetenceProfile p, CancellationToken _) => p);
    }

    private void SetupTouchProfile()
    {
        // TouchProfileAsync calls GetByUserId + SaveAsync one more time after mutation.
        _repoMock.Setup(r => r.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(MakeProfile());
        _repoMock.Setup(r => r.SaveAsync(It.IsAny<EmployeeCompetenceProfile>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync((EmployeeCompetenceProfile p, CancellationToken _) => p);
    }
}
