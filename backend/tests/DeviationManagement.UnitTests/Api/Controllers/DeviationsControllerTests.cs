using System.Security.Claims;
using DeviationManagement.Api.Contracts.Requests;
using DeviationManagement.Api.Controllers;
using DeviationManagement.Application.Abstractions.Services;
using DeviationManagement.Application.DTOs;
using DeviationManagement.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace DeviationManagement.UnitTests.Api.Controllers;

public sealed class DeviationsControllerTests
{
    private const string TestOwnerId = "test-owner-sub-001";

    private readonly Mock<IDeviationService> _serviceMock;
    private readonly DeviationsController _sut;

    public DeviationsControllerTests()
    {
        _serviceMock = new Mock<IDeviationService>();
        _sut = new DeviationsController(_serviceMock.Object);

        // Set up an authenticated user principal with the expected NameIdentifier claim
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, TestOwnerId),
            new Claim(ClaimTypes.Name, "Test User")
        };
        var identity = new ClaimsIdentity(claims, "TestScheme");
        var principal = new ClaimsPrincipal(identity);

        _sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    /// <summary>Creates a controller whose principal has NO sub/NameIdentifier claim.</summary>
    private DeviationsController CreateSutWithoutSubClaim()
    {
        var sut = new DeviationsController(_serviceMock.Object);
        var claims = new[] { new Claim(ClaimTypes.Name, "No Sub User") };
        var identity = new ClaimsIdentity(claims, "TestScheme");
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return sut;
    }

    private static DeviationDto BuildDto(Guid? id = null) => new(
        id ?? Guid.NewGuid(),
        "Title",
        "Description",
        DeviationSeverity.Low,
        DeviationStatus.Open,
        "Reporter",
        DateTimeOffset.UtcNow.AddDays(-1),
        DateTimeOffset.UtcNow);

    private static SaveDeviationApiRequest ValidApiRequest() => new(
        "Title",
        "Description",
        DeviationSeverity.Low,
        DeviationStatus.Open,
        "Reporter",
        DateTimeOffset.UtcNow.AddDays(-1));

    // ─── GET /api/deviations ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_ReturnsOkWithItems()
    {
        var dtos = new List<DeviationDto> { BuildDto(), BuildDto() };
        _serviceMock.Setup(s => s.GetAllAsync(TestOwnerId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(dtos);

        var result = await _sut.GetAll(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetAll_PassesOwnerIdToService()
    {
        _serviceMock.Setup(s => s.GetAllAsync(TestOwnerId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new List<DeviationDto>());

        await _sut.GetAll(CancellationToken.None);

        _serviceMock.Verify(s => s.GetAllAsync(TestOwnerId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAll_MissingSubClaim_ReturnsUnauthorized_AndDoesNotCallService()
    {
        var sut = CreateSutWithoutSubClaim();

        var result = await sut.GetAll(CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result);
        _serviceMock.Verify(s => s.GetAllAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ─── GET /api/deviations/{id} ─────────────────────────────────────────────

    [Fact]
    public async Task GetById_ExistingId_ReturnsOk()
    {
        var dto = BuildDto();
        _serviceMock.Setup(s => s.GetByIdAsync(dto.Id, TestOwnerId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(dto);

        var result = await _sut.GetById(dto.Id, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_MissingId_ReturnsNotFoundWithProblemDetails()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), TestOwnerId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((DeviationDto?)null);

        var result = await _sut.GetById(Guid.NewGuid(), CancellationToken.None);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task GetById_MissingSubClaim_ReturnsUnauthorized_AndDoesNotCallService()
    {
        var sut = CreateSutWithoutSubClaim();

        var result = await sut.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result);
        _serviceMock.Verify(
            s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ─── POST /api/deviations ─────────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidRequest_ReturnsCreatedAtAction()
    {
        var dto = BuildDto();
        _serviceMock
            .Setup(s => s.CreateAsync(It.IsAny<SaveDeviationRequest>(), TestOwnerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((dto, (Dictionary<string, string[]>?)null));

        var result = await _sut.Create(ValidApiRequest(), CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(201, created.StatusCode);
        Assert.Equal(nameof(_sut.GetById), created.ActionName);
    }

    [Fact]
    public async Task Create_InvalidRequest_ReturnsBadRequestWithValidationProblemDetails()
    {
        var errors = new Dictionary<string, string[]> { ["title"] = ["Title is required."] };
        _serviceMock
            .Setup(s => s.CreateAsync(It.IsAny<SaveDeviationRequest>(), TestOwnerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((DeviationDto?)null, errors));

        var result = await _sut.Create(ValidApiRequest(), CancellationToken.None);

        var objResult = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, objResult.StatusCode);
        Assert.IsType<ValidationProblemDetails>(objResult.Value);
    }

    [Fact]
    public async Task Create_MissingSubClaim_ReturnsUnauthorized_AndDoesNotCallService()
    {
        var sut = CreateSutWithoutSubClaim();

        var result = await sut.Create(ValidApiRequest(), CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result);
        _serviceMock.Verify(
            s => s.CreateAsync(It.IsAny<SaveDeviationRequest>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ─── PUT /api/deviations/{id} ─────────────────────────────────────────────

    [Fact]
    public async Task Update_ValidRequest_ReturnsOk()
    {
        var dto = BuildDto();
        _serviceMock
            .Setup(s => s.UpdateAsync(dto.Id, It.IsAny<SaveDeviationRequest>(), TestOwnerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((dto, false, false, (Dictionary<string, string[]>?)null));

        var result = await _sut.Update(dto.Id, ValidApiRequest(), CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_NotFound_ReturnsNotFoundWithProblemDetails()
    {
        _serviceMock
            .Setup(s => s.UpdateAsync(It.IsAny<Guid>(), It.IsAny<SaveDeviationRequest>(), TestOwnerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((DeviationDto?)null, true, false, (Dictionary<string, string[]>?)null));

        var result = await _sut.Update(Guid.NewGuid(), ValidApiRequest(), CancellationToken.None);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task Update_Forbidden_Returns403WithProblemDetails()
    {
        _serviceMock
            .Setup(s => s.UpdateAsync(It.IsAny<Guid>(), It.IsAny<SaveDeviationRequest>(), TestOwnerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((DeviationDto?)null, false, true, (Dictionary<string, string[]>?)null));

        var result = await _sut.Update(Guid.NewGuid(), ValidApiRequest(), CancellationToken.None);

        var objResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objResult.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(objResult.Value);
        Assert.Equal(403, problem.Status);
    }

    [Fact]
    public async Task Update_InvalidRequest_ReturnsBadRequestWithValidationProblemDetails()
    {
        var errors = new Dictionary<string, string[]> { ["title"] = ["Title is required."] };
        _serviceMock
            .Setup(s => s.UpdateAsync(It.IsAny<Guid>(), It.IsAny<SaveDeviationRequest>(), TestOwnerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((DeviationDto?)null, false, false, errors));

        var result = await _sut.Update(Guid.NewGuid(), ValidApiRequest(), CancellationToken.None);

        var objResult = Assert.IsAssignableFrom<ObjectResult>(result);
        Assert.Equal(400, objResult.StatusCode);
        Assert.IsType<ValidationProblemDetails>(objResult.Value);
    }

    [Fact]
    public async Task Update_MissingSubClaim_ReturnsUnauthorized_AndDoesNotCallService()
    {
        var sut = CreateSutWithoutSubClaim();

        var result = await sut.Update(Guid.NewGuid(), ValidApiRequest(), CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result);
        _serviceMock.Verify(
            s => s.UpdateAsync(
                It.IsAny<Guid>(), It.IsAny<SaveDeviationRequest>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ─── DELETE /api/deviations/{id} ──────────────────────────────────────────

    [Fact]
    public async Task Delete_ExistingId_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.DeleteAsync(id, TestOwnerId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((true, false));

        var result = await _sut.Delete(id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_MissingId_ReturnsNotFoundWithProblemDetails()
    {
        _serviceMock.Setup(s => s.DeleteAsync(It.IsAny<Guid>(), TestOwnerId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((false, false));

        var result = await _sut.Delete(Guid.NewGuid(), CancellationToken.None);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task Delete_Forbidden_Returns403WithProblemDetails()
    {
        _serviceMock.Setup(s => s.DeleteAsync(It.IsAny<Guid>(), TestOwnerId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((false, true));

        var result = await _sut.Delete(Guid.NewGuid(), CancellationToken.None);

        var objResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objResult.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(objResult.Value);
        Assert.Equal(403, problem.Status);
    }

    [Fact]
    public async Task Delete_MissingSubClaim_ReturnsUnauthorized_AndDoesNotCallService()
    {
        var sut = CreateSutWithoutSubClaim();

        var result = await sut.Delete(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<UnauthorizedObjectResult>(result);
        _serviceMock.Verify(
            s => s.DeleteAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
