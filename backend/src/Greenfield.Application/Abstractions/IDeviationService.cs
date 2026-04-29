using Greenfield.Application.Common;
using Greenfield.Application.Deviations;

namespace Greenfield.Application.Abstractions;

/// <summary>
/// Business-logic contract for the deviation / non-conformity management feature.
/// <para>
/// Transition return tuple semantics:
/// <list type="bullet">
///   <item><c>(Deviation, null)</c> – success.</item>
///   <item><c>(null, null)</c> – deviation not found.</item>
///   <item><c>(null, errorMsg)</c> – invalid transition.</item>
/// </list>
/// </para>
/// </summary>
public interface IDeviationService
{
    Task<PagedResult<DeviationSummaryDto>> GetDeviationsAsync(
        DeviationListQuery query, CancellationToken ct = default);

    Task<DeviationDto?> GetDeviationByIdAsync(Guid id, CancellationToken ct = default);

    Task<DeviationDto> CreateDeviationAsync(
        CreateDeviationRequest request, CancellationToken ct = default);

    Task<DeviationDto?> UpdateDeviationAsync(
        Guid id, UpdateDeviationRequest request, CancellationToken ct = default);

    Task<bool> DeleteDeviationAsync(Guid id, CancellationToken ct = default);

    Task<(DeviationDto? Deviation, string? Error)> TransitionDeviationAsync(
        Guid id, TransitionDeviationRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<ActivityDto>> GetTimelineAsync(Guid id, CancellationToken ct = default);

    Task<ActivityDto?> AddCommentAsync(
        Guid id, AddCommentRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<AttachmentDto>?> GetAttachmentsAsync(Guid id, CancellationToken ct = default);

    Task<AttachmentDto?> AddAttachmentAsync(
        Guid id, UploadAttachmentRequest request, CancellationToken ct = default);

    Task<bool> RemoveAttachmentAsync(Guid id, Guid attachmentId, CancellationToken ct = default);

    Task<string> ExportToCsvAsync(DeviationListQuery query, CancellationToken ct = default);
}
