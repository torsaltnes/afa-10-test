using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;

namespace GreenfieldArchitecture.Api.Tests.Infrastructure;

/// <summary>
/// Bootstraps the API for integration testing.
/// </summary>
public sealed class GreenfieldArchitectureApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);
    }
}
