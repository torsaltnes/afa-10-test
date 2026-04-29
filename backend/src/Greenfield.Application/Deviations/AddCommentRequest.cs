namespace Greenfield.Application.Deviations;

/// <summary>Command to append a comment to a deviation's timeline.</summary>
public sealed record AddCommentRequest(
    string Comment,
    string PerformedBy);
