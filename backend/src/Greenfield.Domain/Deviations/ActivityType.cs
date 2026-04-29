namespace Greenfield.Domain.Deviations;

/// <summary>Classifies a <see cref="DeviationActivity"/> entry on the timeline.</summary>
public enum ActivityType
{
    Created,
    StatusChanged,
    CommentAdded,
    AttachmentAdded,
    AttachmentRemoved,
    Updated,
}
