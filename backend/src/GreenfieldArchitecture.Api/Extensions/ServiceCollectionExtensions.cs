using GreenfieldArchitecture.Api.Authentication;
using GreenfieldArchitecture.Api.Context;
using GreenfieldArchitecture.Application.Abstractions.Health;
using GreenfieldArchitecture.Application.Deviations.Abstractions;
using GreenfieldArchitecture.Application.Deviations.Services;
using GreenfieldArchitecture.Application.Health.Services;
using GreenfieldArchitecture.Application.Profile.Abstractions;
using GreenfieldArchitecture.Application.Profile.Services;
using GreenfieldArchitecture.Infrastructure.Deviations.Repositories;
using GreenfieldArchitecture.Infrastructure.Health;
using GreenfieldArchitecture.Infrastructure.Profile.Repositories;
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

        // Required for HttpContextCurrentUserContext to resolve per-request identity.
        services.AddHttpContextAccessor();

        // ── Authentication ─────────────────────────────────────────────────
        // Load the server-side token→employeeId map from configuration.
        // The DevApiKeyAuthHandler validates the Bearer token against this map so
        // that the identity is always resolved server-side (IDOR prevention).
        // When real JWT/OIDC is introduced, replace the "DevApiKey" scheme with
        // .AddJwtBearer(...) and remove the DevApiKeys configuration section.
        var devApiKeys = configuration
            .GetSection("DevApiKeys")
            .Get<Dictionary<string, string>>() ?? [];

        services
            .AddAuthentication("DevApiKey")
            .AddScheme<DevApiKeyOptions, DevApiKeyAuthHandler>("DevApiKey", options =>
            {
                foreach (var kv in devApiKeys)
                    options.ApiKeys[kv.Key] = kv.Value;
            });

        services.AddAuthorization();

        // ── Health ─────────────────────────────────────────────────────────
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

        // ── Deviations ─────────────────────────────────────────────────────
        // Repository is singleton (in-memory store must outlive request scopes).
        services.AddSingleton<IDeviationRepository, InMemoryDeviationRepository>();
        services.AddScoped<IDeviationService, DeviationService>();

        // ── Profile ────────────────────────────────────────────────────────
        // Repository is singleton (in-memory store must outlive request scopes).
        // ICurrentUserContext is Scoped because it wraps IHttpContextAccessor which is
        // request-specific; it must NOT be Singleton.
        services.AddSingleton<IEmployeeCompetenceProfileRepository, InMemoryEmployeeCompetenceProfileRepository>();
        services.AddScoped<ICurrentUserContext, HttpContextCurrentUserContext>();
        services.AddScoped<IEmployeeCompetenceProfileService, EmployeeCompetenceProfileService>();

        return services;
    }
}
