using System.Text.Json.Serialization;
using Greenfield.Api.Endpoints;
using Greenfield.Application.Extensions;
using Greenfield.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// ── OpenAPI ────────────────────────────────────────────────────────────────
builder.Services.AddOpenApi();

// ── Health checks ─────────────────────────────────────────────────────────
builder.Services.AddHealthChecks();

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()));

// ── JSON serialisation ────────────────────────────────────────────────────
// Serialise all enums as their string names (e.g. "Healthy" not 0).
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// ── Application & Infrastructure services ────────────────────────────────
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();

// ─────────────────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Redirect to HTTPS only in non-development environments.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();

// ── Endpoints ─────────────────────────────────────────────────────────────
app.MapHealthEndpoints();
app.MapDeviationEndpoints();

app.Run();

// Expose the implicit Program type to the integration-test assembly.
public partial class Program { }
