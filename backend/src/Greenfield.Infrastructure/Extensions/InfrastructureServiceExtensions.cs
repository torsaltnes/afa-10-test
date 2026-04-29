using Greenfield.Application.Abstractions;
using Greenfield.Infrastructure.Health;
using Microsoft.Extensions.DependencyInjection;

namespace Greenfield.Infrastructure.Extensions;

/// <summary>Registers infrastructure-layer services with the DI container.</summary>
public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<IHealthStatusService, HealthStatusService>();
        return services;
    }
}
