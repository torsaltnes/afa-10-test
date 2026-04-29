using Microsoft.Extensions.DependencyInjection;

namespace Greenfield.Application.Extensions;

/// <summary>Registers application-layer services with the DI container.</summary>
public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Application-layer registrations go here as the feature set grows.
        return services;
    }
}
