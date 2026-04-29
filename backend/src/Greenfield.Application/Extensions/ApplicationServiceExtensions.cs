using Greenfield.Application.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace Greenfield.Application.Extensions;

/// <summary>Registers application-layer services with the DI container.</summary>
public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton<IDeviationService, Greenfield.Application.Deviations.DeviationService>();
        return services;
    }
}
