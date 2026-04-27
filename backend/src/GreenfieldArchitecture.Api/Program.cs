using System.Text.Json.Serialization;
using GreenfieldArchitecture.Api.Endpoints;
using GreenfieldArchitecture.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProjectServices(builder.Configuration, builder.Environment);
builder.Services.AddHealthChecks();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins("http://localhost:4200", "https://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod()));

// Serialize enums as readable strings so Angular can bind enum names directly.
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Only redirect to HTTPS outside Development to avoid SSL errors for
// developers who have not trusted the local dev certificate.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();

app.MapHealthEndpoints();
app.MapHealthChecks("/health/live");
app.MapDeviationEndpoints();

app.Run();

// Required for WebApplicationFactory<Program> in integration tests.
public partial class Program { }
