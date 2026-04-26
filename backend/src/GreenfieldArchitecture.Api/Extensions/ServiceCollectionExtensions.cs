using GreenfieldArchitecture.Application.Abstractions.Deviations;
using GreenfieldArchitecture.Application.Abstractions.Health;
using GreenfieldArchitecture.Application.Deviations.Services;
using GreenfieldArchitecture.Application.Health.Services;
using GreenfieldArchitecture.Infrastructure.Deviations;
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
        // ── CORS ──────────────────────────────────────────────────────────────
        services.AddCors(options =>
            options.AddDefaultPolicy(policy => policy
                .WithOrigins("http://localhost:4200", "https://localhost:4200")
                .AllowAnyHeader()
                .AllowAnyMethod()));

        // ── Infrastructure ────────────────────────────────────────────────────
        services.AddSingleton(TimeProvider.System);

        // ── Health ────────────────────────────────────────────────────────────
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

        // ── Deviations ────────────────────────────────────────────────────────
        services.AddSingleton<IDeviationRepository, InMemoryDeviationRepository>();
        services.AddScoped<IDeviationService, DeviationService>();

        return services;
    }
}
