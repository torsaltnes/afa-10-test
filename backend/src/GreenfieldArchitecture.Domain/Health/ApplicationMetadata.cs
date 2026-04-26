namespace GreenfieldArchitecture.Domain.Health;

/// <summary>
/// Immutable metadata supplied by the infrastructure layer describing the running application.
/// </summary>
public sealed record ApplicationMetadata(
    string ServiceName,
    string Version,
    string EnvironmentName);
