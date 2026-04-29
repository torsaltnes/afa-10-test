namespace Greenfield.Domain.Deviations;

/// <summary>File attachment stored alongside a <see cref="Deviation"/>.</summary>
public sealed class DeviationAttachment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid DeviationId { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public string UploadedBy { get; init; } = string.Empty;
    public DateTimeOffset UploadedAt { get; init; } = DateTimeOffset.UtcNow;
    public byte[] Content { get; init; } = [];
}
