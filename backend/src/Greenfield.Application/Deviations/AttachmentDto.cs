namespace Greenfield.Application.Deviations;

/// <summary>Attachment metadata DTO – does not include raw file bytes.</summary>
public sealed record AttachmentDto(
    Guid Id,
    Guid DeviationId,
    string FileName,
    string ContentType,
    long SizeBytes,
    string UploadedBy,
    DateTimeOffset UploadedAt);
