namespace Greenfield.Api.Contracts;

public record HealthCheckResponse(
    string Status,
    string ApplicationName,
    string Environment,
    DateTimeOffset CheckedAtUtc);
