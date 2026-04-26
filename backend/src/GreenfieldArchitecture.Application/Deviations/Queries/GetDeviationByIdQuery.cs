namespace GreenfieldArchitecture.Application.Deviations.Queries;

/// <summary>
/// Query to retrieve a single deviation by its unique identifier.
/// </summary>
public sealed record GetDeviationByIdQuery(Guid Id);
