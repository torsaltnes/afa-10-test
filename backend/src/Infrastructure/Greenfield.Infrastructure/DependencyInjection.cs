using Greenfield.Application.Abstractions.Health;
using Greenfield.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Greenfield.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IHealthCheckService, SystemHealthCheckService>();
        return services;
    }
}
