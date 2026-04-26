namespace GreenfieldArchitecture.Domain.Deviations;

/// <summary>
/// Domain model representing a deviation / non-conformity.
/// Immutable after construction; mutations return new instances via member methods.
/// </summary>
public sealed class Deviation
{
    // Private constructor — use static factory.
    private Deviation(
        Guid id,
        string title,
        string description,
        DeviationSeverity severity,
        DeviationStatus status,
        DateTimeOffset createdAtUtc,
        DateTimeOffset lastModifiedAtUtc)
    {
        Id = id;
        Title = title;
        Description = description;
        Severity = severity;
        Status = status;
        CreatedAtUtc = createdAtUtc;
        LastModifiedAtUtc = lastModifiedAtUtc;
    }

    public Guid Id { get; }
    public string Title { get; private set; }
    public string Description { get; private set; }
    public DeviationSeverity Severity { get; private set; }
    public DeviationStatus Status { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; }
    public DateTimeOffset LastModifiedAtUtc { get; private set; }

    /// <summary>
    /// Creates a new <see cref="Deviation"/> with validated inputs.
    /// </summary>
    public static Deviation Create(
        string title,
        string description,
        DeviationSeverity severity,
        DeviationStatus status,
        DateTimeOffset createdAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title, nameof(title));
        ArgumentException.ThrowIfNullOrWhiteSpace(description, nameof(description));

        return new Deviation(
            id: Guid.NewGuid(),
            title: title.Trim(),
            description: description.Trim(),
            severity: severity,
            status: status,
            createdAtUtc: createdAtUtc,
            lastModifiedAtUtc: createdAtUtc);
    }

    /// <summary>
    /// Returns an updated copy of the deviation with new field values and a refreshed <see cref="LastModifiedAtUtc"/>.
    /// </summary>
    public Deviation UpdateDetails(
        string title,
        string description,
        DeviationSeverity severity,
        DeviationStatus status,
        DateTimeOffset lastModifiedAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title, nameof(title));
        ArgumentException.ThrowIfNullOrWhiteSpace(description, nameof(description));

        return new Deviation(
            id: Id,
            title: title.Trim(),
            description: description.Trim(),
            severity: severity,
            status: status,
            createdAtUtc: CreatedAtUtc,
            lastModifiedAtUtc: lastModifiedAtUtc);
    }
}
