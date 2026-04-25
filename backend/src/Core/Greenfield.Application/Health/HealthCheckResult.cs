namespace Greenfield.Application.Health;

public record HealthCheckResult(
    string Status,
    string ApplicationName,
    string Environment,
    DateTimeOffset CheckedAtUtc);
