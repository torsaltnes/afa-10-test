namespace GreenfieldArchitecture.Application.Deviations.Commands;

/// <summary>
/// Command to remove a deviation by its identifier.
/// </summary>
public sealed record DeleteDeviationCommand(Guid Id);
