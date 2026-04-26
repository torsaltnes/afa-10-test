using GreenfieldArchitecture.Application.Abstractions.Health;
using GreenfieldArchitecture.Domain.Health;

namespace GreenfieldArchitecture.Infrastructure.Health;

/// <summary>
/// Provides application metadata resolved from the hosting environment.
/// Pure implementation — no ASP.NET dependency.
/// </summary>
public sealed class ApplicationMetadataProvider(
    string serviceName,
    string version,
    string environmentName) : IApplicationMetadataProvider
{
    private readonly string _serviceName = Validated(serviceName, nameof(serviceName));
    private readonly string _version = Validated(version, nameof(version));
    private readonly string _environmentName = Validated(environmentName, nameof(environmentName));

    public ApplicationMetadata GetMetadata() =>
        new(_serviceName, _version, _environmentName);

    private static string Validated(string value, string paramName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, paramName);
        return value;
    }
}
