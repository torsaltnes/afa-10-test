using GreenfieldArchitecture.Domain.Health;

namespace GreenfieldArchitecture.Application.Abstractions.Health;

/// <summary>
/// Provides application metadata; implemented by the Infrastructure layer.
/// </summary>
public interface IApplicationMetadataProvider
{
    ApplicationMetadata GetMetadata();
}
