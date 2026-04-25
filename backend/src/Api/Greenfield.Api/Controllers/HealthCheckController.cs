using Greenfield.Api.Contracts;
using Greenfield.Application.Abstractions.Health;
using Microsoft.AspNetCore.Mvc;

namespace Greenfield.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthCheckController(IHealthCheckService healthCheckService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<HealthCheckResponse>> Get(CancellationToken cancellationToken)
    {
        var result = await healthCheckService.GetCurrentAsync(cancellationToken);

        var response = new HealthCheckResponse(
            Status: result.Status,
            ApplicationName: result.ApplicationName,
            Environment: result.Environment,
            CheckedAtUtc: result.CheckedAtUtc);

        return Ok(response);
    }
}
