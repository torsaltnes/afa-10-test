using GreenfieldArchitecture.Infrastructure.Deviations;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace GreenfieldArchitecture.Api.Tests.Infrastructure;

/// <summary>
/// Bootstraps the API for integration testing.
/// <para>
/// Authentication is replaced with <see cref="TestAuthHandler"/> so that every
/// request made via <see cref="CreateClient()"/> is automatically authenticated.
/// Tests that explicitly need to verify 401 behaviour should use
/// <see cref="CreateUnauthenticatedClient()"/> instead.
/// </para>
/// Each test that needs a clean deviation store should call
/// <see cref="ResetDeviationRepository"/> before the test body runs.
/// </summary>
public sealed class GreenfieldArchitectureApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);

        // Supply the JWT settings required by ServiceCollectionExtensions even
        // though the test authentication scheme bypasses JWT validation at runtime.
        builder.UseSetting("Jwt:Issuer", "test-issuer");
        builder.UseSetting("Jwt:Audience", "test-audience");
        builder.UseSetting("Jwt:SigningKey", "test-signing-key-minimum-32-chars-for-hmac-sha256");

        builder.ConfigureServices(services =>
        {
            // Replace the production JWT Bearer scheme with the test scheme so
            // integration tests do not need to produce real JWT tokens.
            services
                .AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName, _ => { });
        });
    }

    /// <summary>
    /// Returns an <see cref="HttpClient"/> whose requests are automatically
    /// authenticated by <see cref="TestAuthHandler"/>. Suitable for all tests
    /// that exercise authorized endpoints.
    /// </summary>
    public new HttpClient CreateClient() => base.CreateClient();

    /// <summary>
    /// Returns an <see cref="HttpClient"/> that sends requests with no credentials.
    /// Use this to assert that protected endpoints return <c>401 Unauthorized</c>.
    /// </summary>
    public HttpClient CreateUnauthenticatedClient()
    {
        // Spin up a separate host that keeps the real auth pipeline (JWT Bearer)
        // but supplies no token — every request will be unauthenticated.
        var unauthFactory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(b =>
            {
                b.UseEnvironment(Environments.Development);
                b.UseSetting("Jwt:Issuer", "test-issuer");
                b.UseSetting("Jwt:Audience", "test-audience");
                b.UseSetting("Jwt:SigningKey", "test-signing-key-minimum-32-chars-for-hmac-sha256");
            });

        return unauthFactory.CreateClient();
    }

    /// <summary>
    /// Clears all entries from the singleton in-memory deviation repository
    /// so tests start from a known empty state.
    /// </summary>
    public void ResetDeviationRepository()
    {
        using var scope = Services.CreateScope();
        var repo = scope.ServiceProvider
            .GetRequiredService<GreenfieldArchitecture.Application.Abstractions.Deviations.IDeviationRepository>()
            as InMemoryDeviationRepository;

        repo?.Clear();
    }
}
