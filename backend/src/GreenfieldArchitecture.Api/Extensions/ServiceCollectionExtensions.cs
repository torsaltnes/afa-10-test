using GreenfieldArchitecture.Application.Abstractions.Health;
using GreenfieldArchitecture.Application.Deviations.Abstractions;
using GreenfieldArchitecture.Application.Deviations.Services;
using GreenfieldArchitecture.Application.Health.Services;
using GreenfieldArchitecture.Infrastructure.Deviations.Repositories;
using GreenfieldArchitecture.Infrastructure.Health;
using System.Reflection;

namespace GreenfieldArchitecture.Api.Extensions;

/// <summary>
/// Extension methods that register application services with the DI container.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddProjectServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        services.AddSingleton(TimeProvider.System);

        // Health
        services.AddScoped<IHealthService, HealthService>();

        services.AddSingleton<IApplicationMetadataProvider>(sp =>
        {
            var serviceName = configuration["Application:Name"]
                              ?? environment.ApplicationName;

            ArgumentException.ThrowIfNullOrWhiteSpace(serviceName, "Application:Name");

            var version = Assembly.GetEntryAssembly()
                              ?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()
                              ?.InformationalVersion
                          ?? "0.0.0";

            var environmentName = environment.EnvironmentName;
            ArgumentException.ThrowIfNullOrWhiteSpace(environmentName, nameof(environmentName));

            return new ApplicationMetadataProvider(serviceName, version, environmentName);
        });

        // Deviations — repository is singleton (in-memory store must outlive request scopes)
        services.AddSingleton<IDeviationRepository, InMemoryDeviationRepository>();
        services.AddScoped<IDeviationService, DeviationService>();

        return services;
    }
}
