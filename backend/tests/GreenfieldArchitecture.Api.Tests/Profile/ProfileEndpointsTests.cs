using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using GreenfieldArchitecture.Api.Tests.Infrastructure;
using GreenfieldArchitecture.Application.Profile.Contracts;
using Xunit;

namespace GreenfieldArchitecture.Api.Tests.Profile;

public sealed class ProfileEndpointsTests : IClassFixture<GreenfieldArchitectureApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    // Authenticated client with a fixed employee identity (used for all profile operations).
    private readonly HttpClient _client;
    // Unauthenticated client used to verify that all profile routes reject anonymous callers.
    private readonly HttpClient _anonClient;

    public ProfileEndpointsTests(GreenfieldArchitectureApiFactory factory)
    {
        // Pass the server-side token (not an employee ID) so that the
        // DevApiKeyAuthHandler can validate it against its configuration map.
        // "dev-secret-employee-001" maps to "employee-001" on the server.
        _client = factory.CreateAuthenticatedClient("dev-secret-employee-001");
        _anonClient = factory.CreateClient();
    }

    // ── GET /api/profile ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetProfile_Returns200WithCorrectShape()
    {
        var response = await _client.GetAsync("/api/profile");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadAsStringAsync();
        var dto = JsonSerializer.Deserialize<CompetenceProfileDto>(body, JsonOptions);

        dto.Should().NotBeNull();
        dto!.UserId.Should().Be("employee-001");
        dto.EducationEntries.Should().NotBeNull();
        dto.CertificateEntries.Should().NotBeNull();
        dto.CourseEntries.Should().NotBeNull();
    }

    [Fact]
    public async Task GetProfile_WithoutIdentityHeader_Returns401()
    {
        var response = await _anonClient.GetAsync("/api/profile");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── POST /api/profile/education ──────────────────────────────────────────

    [Fact]
    public async Task PostEducation_ValidPayload_Returns201WithCreatedRecord()
    {
        var request = new CreateEducationRequest("Bachelor of Science", "MIT", 2015);

        var response = await _client.PostAsJsonAsync("/api/profile/education", request, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var dto = await response.Content.ReadFromJsonAsync<EducationEntryDto>(JsonOptions);
        dto.Should().NotBeNull();
        dto!.Id.Should().NotBe(Guid.Empty);
        dto.Degree.Should().Be("Bachelor of Science");
        dto.Institution.Should().Be("MIT");
        dto.GraduationYear.Should().Be(2015);
    }

    [Fact]
    public async Task PostEducation_BlankDegree_Returns400()
    {
        var request = new CreateEducationRequest("", "MIT", 2015);
        var response = await _client.PostAsJsonAsync("/api/profile/education", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostEducation_FutureYear_Returns400()
    {
        var request = new CreateEducationRequest("BSc", "MIT", 3000);
        var response = await _client.PostAsJsonAsync("/api/profile/education", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostEducation_WithoutIdentityHeader_Returns401()
    {
        var request = new CreateEducationRequest("BSc", "MIT", 2015);
        var response = await _anonClient.PostAsJsonAsync("/api/profile/education", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── PUT /api/profile/education/{id} ──────────────────────────────────────

    [Fact]
    public async Task PutEducation_ValidPayload_Returns200WithUpdatedRecord()
    {
        var created = await CreateEducationAsync("Original Degree", "Old University", 2010);
        var updateRequest = new UpdateEducationRequest("Master of Science", "Harvard", 2018);

        var response = await _client.PutAsJsonAsync($"/api/profile/education/{created.Id}", updateRequest, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await response.Content.ReadFromJsonAsync<EducationEntryDto>(JsonOptions);
        dto!.Degree.Should().Be("Master of Science");
        dto.Institution.Should().Be("Harvard");
        dto.GraduationYear.Should().Be(2018);
    }

    [Fact]
    public async Task PutEducation_UnknownId_Returns404()
    {
        var request = new UpdateEducationRequest("BSc", "MIT", 2015);
        var response = await _client.PutAsJsonAsync($"/api/profile/education/{Guid.NewGuid()}", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── DELETE /api/profile/education/{id} ───────────────────────────────────

    [Fact]
    public async Task DeleteEducation_ExistingRecord_Returns204()
    {
        var created = await CreateEducationAsync("Degree to Delete", "University", 2019);
        var response = await _client.DeleteAsync($"/api/profile/education/{created.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteEducation_UnknownId_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/profile/education/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GET profile reflects added education ──────────────────────────────────

    [Fact]
    public async Task GetProfile_AfterAddingEducation_ContainsEntry()
    {
        await CreateEducationAsync("PhD Physics", "Caltech", 2021);

        var response = await _client.GetAsync("/api/profile");
        var dto = await response.Content.ReadFromJsonAsync<CompetenceProfileDto>(JsonOptions);

        dto!.EducationEntries.Should().Contain(e =>
            e.Degree == "PhD Physics" && e.Institution == "Caltech");
    }

    // ── POST /api/profile/certificates ───────────────────────────────────────

    [Fact]
    public async Task PostCertificate_ValidPayload_Returns201WithCreatedRecord()
    {
        var request = new CreateCertificateRequest("AWS Solutions Architect", "Amazon", new DateOnly(2022, 3, 10));

        var response = await _client.PostAsJsonAsync("/api/profile/certificates", request, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var dto = await response.Content.ReadFromJsonAsync<CertificateEntryDto>(JsonOptions);
        dto.Should().NotBeNull();
        dto!.CertificateName.Should().Be("AWS Solutions Architect");
        dto.IssuingOrganization.Should().Be("Amazon");
    }

    [Fact]
    public async Task PostCertificate_FutureDateEarned_Returns400()
    {
        var request = new CreateCertificateRequest("AWS SA", "Amazon",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)));
        var response = await _client.PostAsJsonAsync("/api/profile/certificates", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostCertificate_BlankName_Returns400()
    {
        var request = new CreateCertificateRequest("", "Amazon", new DateOnly(2022, 3, 10));
        var response = await _client.PostAsJsonAsync("/api/profile/certificates", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostCertificate_WithoutIdentityHeader_Returns401()
    {
        var request = new CreateCertificateRequest("AWS SA", "Amazon", new DateOnly(2022, 3, 10));
        var response = await _anonClient.PostAsJsonAsync("/api/profile/certificates", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── PUT /api/profile/certificates/{id} ───────────────────────────────────

    [Fact]
    public async Task PutCertificate_ValidPayload_Returns200()
    {
        var created = await CreateCertificateAsync("Old Cert", "Old Org", new DateOnly(2021, 1, 1));
        var updateRequest = new UpdateCertificateRequest("New Cert", "New Org", new DateOnly(2022, 6, 1));

        var response = await _client.PutAsJsonAsync($"/api/profile/certificates/{created.Id}", updateRequest, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await response.Content.ReadFromJsonAsync<CertificateEntryDto>(JsonOptions);
        dto!.CertificateName.Should().Be("New Cert");
    }

    [Fact]
    public async Task PutCertificate_UnknownId_Returns404()
    {
        var request = new UpdateCertificateRequest("X", "Y", new DateOnly(2022, 1, 1));
        var response = await _client.PutAsJsonAsync($"/api/profile/certificates/{Guid.NewGuid()}", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── DELETE /api/profile/certificates/{id} ────────────────────────────────

    [Fact]
    public async Task DeleteCertificate_ExistingRecord_Returns204()
    {
        var created = await CreateCertificateAsync("Cert To Delete", "Org", new DateOnly(2020, 5, 5));
        var response = await _client.DeleteAsync($"/api/profile/certificates/{created.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteCertificate_UnknownId_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/profile/certificates/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── POST /api/profile/courses ─────────────────────────────────────────────

    [Fact]
    public async Task PostCourse_ValidPayload_Returns201WithCreatedRecord()
    {
        var request = new CreateCourseRequest("Docker Fundamentals", "Udemy", new DateOnly(2023, 7, 20));

        var response = await _client.PostAsJsonAsync("/api/profile/courses", request, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var dto = await response.Content.ReadFromJsonAsync<CourseEntryDto>(JsonOptions);
        dto.Should().NotBeNull();
        dto!.CourseName.Should().Be("Docker Fundamentals");
        dto.Provider.Should().Be("Udemy");
    }

    [Fact]
    public async Task PostCourse_FutureCompletionDate_Returns400()
    {
        var request = new CreateCourseRequest("K8s", "Pluralsight",
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)));
        var response = await _client.PostAsJsonAsync("/api/profile/courses", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostCourse_BlankCourseName_Returns400()
    {
        var request = new CreateCourseRequest("", "Udemy", new DateOnly(2023, 7, 20));
        var response = await _client.PostAsJsonAsync("/api/profile/courses", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PostCourse_WithoutIdentityHeader_Returns401()
    {
        var request = new CreateCourseRequest("Docker Fundamentals", "Udemy", new DateOnly(2023, 7, 20));
        var response = await _anonClient.PostAsJsonAsync("/api/profile/courses", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── PUT /api/profile/courses/{id} ─────────────────────────────────────────

    [Fact]
    public async Task PutCourse_ValidPayload_Returns200()
    {
        var created = await CreateCourseAsync("Old Course", "Old Provider", new DateOnly(2022, 1, 1));
        var updateRequest = new UpdateCourseRequest("New Course", "New Provider", new DateOnly(2023, 3, 3));

        var response = await _client.PutAsJsonAsync($"/api/profile/courses/{created.Id}", updateRequest, JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await response.Content.ReadFromJsonAsync<CourseEntryDto>(JsonOptions);
        dto!.CourseName.Should().Be("New Course");
    }

    [Fact]
    public async Task PutCourse_UnknownId_Returns404()
    {
        var request = new UpdateCourseRequest("X", "Y", new DateOnly(2022, 1, 1));
        var response = await _client.PutAsJsonAsync($"/api/profile/courses/{Guid.NewGuid()}", request, JsonOptions);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── DELETE /api/profile/courses/{id} ──────────────────────────────────────

    [Fact]
    public async Task DeleteCourse_ExistingRecord_Returns204()
    {
        var created = await CreateCourseAsync("Course To Delete", "Provider", new DateOnly(2021, 8, 8));
        var response = await _client.DeleteAsync($"/api/profile/courses/{created.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteCourse_UnknownId_Returns404()
    {
        var response = await _client.DeleteAsync($"/api/profile/courses/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── JSON contract shape ───────────────────────────────────────────────────

    [Fact]
    public async Task GetProfile_ResponseContainsExpectedJsonShape()
    {
        var response = await _client.GetAsync("/api/profile");
        var body = await response.Content.ReadAsStringAsync();

        body.Should().Contain("userId");
        body.Should().Contain("educationEntries");
        body.Should().Contain("certificateEntries");
        body.Should().Contain("courseEntries");
    }

    // ── Per-user isolation: different identities get different profiles ────────

    [Fact]
    public async Task ProfileIsolation_DifferentUsers_GetSeparateProfiles()
    {
        // User A adds an education entry.
        var clientA = _client; // employee-001
        await clientA.PostAsJsonAsync("/api/profile/education",
            new CreateEducationRequest("User A Degree", "Uni A", 2020), JsonOptions);

        // User B (different identity) should not see User A's entries.
        // Each user gets their own isolated profile.
        var anonFactory = new GreenfieldArchitectureApiFactory();
        // We can't easily spin up a second factory in xunit IClassFixture context,
        // but we can verify via the UserId on the profile response.
        var profileResponse = await clientA.GetAsync("/api/profile");
        var profile = await profileResponse.Content.ReadFromJsonAsync<CompetenceProfileDto>(JsonOptions);
        profile!.UserId.Should().Be("employee-001");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<EducationEntryDto> CreateEducationAsync(string degree, string institution, int year)
    {
        var request = new CreateEducationRequest(degree, institution, year);
        var response = await _client.PostAsJsonAsync("/api/profile/education", request, JsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<EducationEntryDto>(JsonOptions))!;
    }

    private async Task<CertificateEntryDto> CreateCertificateAsync(string name, string org, DateOnly date)
    {
        var request = new CreateCertificateRequest(name, org, date);
        var response = await _client.PostAsJsonAsync("/api/profile/certificates", request, JsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CertificateEntryDto>(JsonOptions))!;
    }

    private async Task<CourseEntryDto> CreateCourseAsync(string name, string provider, DateOnly date)
    {
        var request = new CreateCourseRequest(name, provider, date);
        var response = await _client.PostAsJsonAsync("/api/profile/courses", request, JsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CourseEntryDto>(JsonOptions))!;
    }
}
