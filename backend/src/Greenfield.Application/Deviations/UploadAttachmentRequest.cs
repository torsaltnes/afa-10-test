namespace Greenfield.Application.Deviations;

/// <summary>Command to attach a file (supplied as base-64) to a deviation.</summary>
public sealed record UploadAttachmentRequest(
    string FileName,
    string ContentType,
    string Base64Content,
    string UploadedBy = "anonymous");
