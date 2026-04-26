using GreenfieldArchitecture.Infrastructure.Deviations;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace GreenfieldArchitecture.Api.Tests.Infrastructure;

/// <summary>
/// Bootstraps the API for integration testing.
/// Each test that needs a clean deviation store should call <see cref="ResetDeviationRepository"/>
/// via the <c>IClassFixture</c> instance before the test body runs.
/// </summary>
public sealed class GreenfieldArchitectureApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);
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
