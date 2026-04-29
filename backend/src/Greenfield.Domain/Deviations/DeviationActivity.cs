namespace Greenfield.Domain.Deviations;

/// <summary>An immutable timeline entry for a <see cref="Deviation"/>.</summary>
public sealed class DeviationActivity
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid DeviationId { get; init; }
    public ActivityType Type { get; init; }
    public string Description { get; init; } = string.Empty;
    public string PerformedBy { get; init; } = string.Empty;
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
    public string? PreviousStatus { get; init; }
    public string? NewStatus { get; init; }
}
