using GreenfieldArchitecture.Api.Endpoints;
using GreenfieldArchitecture.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProjectServices(builder.Configuration, builder.Environment);
builder.Services.AddHealthChecks();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapHealthEndpoints();
app.MapHealthChecks("/health/live");

app.Run();

// Required for WebApplicationFactory<Program> in integration tests.
public partial class Program { }
