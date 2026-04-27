using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Net.Http.Headers;

namespace GreenfieldArchitecture.Api.Tests.Infrastructure;

/// <summary>
/// Bootstraps the API for integration testing.
/// </summary>
public sealed class GreenfieldArchitectureApiFactory : WebApplicationFactory<Program>
{
    // Dev tokens that match the server-side DevApiKeys configuration.
    // These are the same values injected via ConfigureAppConfiguration below.
    private const string Employee001Token = "dev-secret-employee-001";
    private const string Employee002Token = "dev-secret-employee-002";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);

        // Inject the dev API-key map so that DevApiKeyAuthHandler can validate
        // Bearer tokens in integration tests regardless of whether the physical
        // appsettings.Development.json is on the content-root search path.
        builder.ConfigureAppConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"DevApiKeys:{Employee001Token}"] = "employee-001",
                [$"DevApiKeys:{Employee002Token}"] = "employee-002",
            });
        });
    }

    /// <summary>
    /// Creates an <see cref="HttpClient"/> authenticated as the specified employee.
    /// Sends a server-side <c>Authorization: Bearer &lt;token&gt;</c> that the
    /// <c>DevApiKeyAuthHandler</c> validates against its configuration map.
    /// The token is an opaque server-side secret — clients cannot forge a different
    /// employee identity by simply changing a header value.
    /// </summary>
    /// <param name="token">
    /// The dev Bearer token to use. Defaults to <c>dev-secret-employee-001</c>
    /// which maps to <c>employee-001</c> on the server side.
    /// </param>
    public HttpClient CreateAuthenticatedClient(string token = Employee001Token)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}

