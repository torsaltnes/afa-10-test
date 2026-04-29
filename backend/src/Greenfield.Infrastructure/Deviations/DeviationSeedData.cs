using System.Collections.Concurrent;
using Greenfield.Domain.Deviations;

namespace Greenfield.Infrastructure.Deviations;

/// <summary>
/// Provides well-known seed deviations with fixed GUIDs so that integration
/// tests can reference them by identity.
/// </summary>
public static class DeviationSeedData
{
    // ── Well-known IDs (referenced by integration tests) ──────────────────
    public static readonly Guid Dev001Id = new("00000001-0000-0000-0000-000000000001");
    public static readonly Guid Dev002Id = new("00000002-0000-0000-0000-000000000002");
    public static readonly Guid Dev003Id = new("00000003-0000-0000-0000-000000000003");
    public static readonly Guid Dev004Id = new("00000004-0000-0000-0000-000000000004");
    public static readonly Guid Dev005Id = new("00000005-0000-0000-0000-000000000005");
    public static readonly Guid Dev006Id = new("00000006-0000-0000-0000-000000000006");

    internal static void Seed(ConcurrentDictionary<Guid, Deviation> store)
    {
        foreach (var d in BuildSeedDeviations())
            store[d.Id] = d;
    }

    private static IEnumerable<Deviation> BuildSeedDeviations()
    {
        var now = DateTimeOffset.UtcNow;

        // ── DEV-001 : Closed – full lifecycle ─────────────────────────────
        var d1 = CloneWithTimestamp(new Deviation
        {
            Id               = Dev001Id,
            Title            = "Contamination found in Batch B-2024-001",
            Description      = "Foreign particulate matter was detected during routine QC inspection of Batch B-2024-001. Potential cross-contamination from upstream line.",
            Status           = DeviationStatus.Closed,
            Severity         = DeviationSeverity.Critical,
            Category         = DeviationCategory.Quality,
            ReportedBy       = "alice.johnson@example.com",
            AssignedTo       = "bob.smith@example.com",
            DueDate          = now.AddDays(-5),
            Tags             = ["batch", "contamination", "critical"],
            RootCause        = "Worn seals on mixer unit M-07 allowed lubricant ingress.",
            CorrectiveAction = "Replaced all seals on M-07; updated PM schedule to 6-month interval.",
            ClosureNotes     = "All corrective actions verified and closed.",
        }, now.AddDays(-30));
        d1.Timeline.Add(Act(Dev001Id, ActivityType.Created,       "Deviation registered by alice.johnson@example.com.", "alice.johnson@example.com", null,                 "Registered",         now.AddDays(-30)));
        d1.Timeline.Add(Act(Dev001Id, ActivityType.StatusChanged, "Status changed from 'Registered' to 'UnderAssessment'.",                          "bob.smith@example.com", "Registered",         "UnderAssessment",    now.AddDays(-28)));
        d1.Timeline.Add(Act(Dev001Id, ActivityType.StatusChanged, "Status changed from 'UnderAssessment' to 'UnderInvestigation'. Comment: Root-cause analysis initiated.", "bob.smith@example.com", "UnderAssessment", "UnderInvestigation", now.AddDays(-20)));
        d1.Timeline.Add(Act(Dev001Id, ActivityType.CommentAdded,  "Seals on M-07 identified as primary failure source.",                             "bob.smith@example.com", null,                 null,                  now.AddDays(-15)));
        d1.Timeline.Add(Act(Dev001Id, ActivityType.StatusChanged, "Status changed from 'UnderInvestigation' to 'CorrectiveAction'.",                  "bob.smith@example.com", "UnderInvestigation", "CorrectiveAction",  now.AddDays(-12)));
        d1.Timeline.Add(Act(Dev001Id, ActivityType.StatusChanged, "Status changed from 'CorrectiveAction' to 'Closed'. Comment: All actions verified.", "alice.johnson@example.com", "CorrectiveAction", "Closed",         now.AddDays(-5)));
        d1.Attachments.Add(Attach(Dev001Id, "inspection-report.pdf",           "application/pdf", "alice.johnson@example.com", now.AddDays(-30)));
        d1.Attachments.Add(Attach(Dev001Id, "corrective-action-evidence.jpg",  "image/jpeg",      "bob.smith@example.com",     now.AddDays(-12)));
        yield return d1;

        // ── DEV-002 : CorrectiveAction ────────────────────────────────────
        var d2 = CloneWithTimestamp(new Deviation
        {
            Id               = Dev002Id,
            Title            = "Machine M-12 missing calibration certificate",
            Description      = "Annual calibration of machine M-12 was due 2024-11-01. Certificate not found in QMS. Equipment has been used in production without valid calibration.",
            Status           = DeviationStatus.CorrectiveAction,
            Severity         = DeviationSeverity.High,
            Category         = DeviationCategory.Quality,
            ReportedBy       = "carol.white@example.com",
            AssignedTo       = "dave.jones@example.com",
            DueDate          = now.AddDays(7),
            Tags             = ["calibration", "m-12", "equipment"],
            RootCause        = "Calibration reminder was not escalated after initial notification was missed.",
            CorrectiveAction = "Machine sent for calibration; automated escalation added to QMS reminders.",
        }, now.AddDays(-14));
        d2.Timeline.Add(Act(Dev002Id, ActivityType.Created,       "Deviation registered by carol.white@example.com.",                               "carol.white@example.com", null,                  "Registered",         now.AddDays(-14)));
        d2.Timeline.Add(Act(Dev002Id, ActivityType.StatusChanged, "Status changed from 'Registered' to 'UnderAssessment'.",                         "dave.jones@example.com",  "Registered",          "UnderAssessment",    now.AddDays(-13)));
        d2.Timeline.Add(Act(Dev002Id, ActivityType.StatusChanged, "Status changed from 'UnderAssessment' to 'UnderInvestigation'.",                  "dave.jones@example.com",  "UnderAssessment",     "UnderInvestigation", now.AddDays(-10)));
        d2.Timeline.Add(Act(Dev002Id, ActivityType.StatusChanged, "Status changed from 'UnderInvestigation' to 'CorrectiveAction'.",                 "dave.jones@example.com",  "UnderInvestigation",  "CorrectiveAction",  now.AddDays(-6)));
        yield return d2;

        // ── DEV-003 : UnderInvestigation ──────────────────────────────────
        var d3 = CloneWithTimestamp(new Deviation
        {
            Id          = Dev003Id,
            Title       = "Chemical spill in storage area C",
            Description = "A 20-litre drum of solvent XY-44 was found toppled in storage area C. Spill estimated at 5 litres. Area evacuated and emergency response team deployed.",
            Status      = DeviationStatus.UnderInvestigation,
            Severity    = DeviationSeverity.Critical,
            Category    = DeviationCategory.Safety,
            ReportedBy  = "eve.martin@example.com",
            AssignedTo  = "frank.lee@example.com",
            DueDate     = now.AddDays(3),
            Tags        = ["spill", "safety", "solvent"],
        }, now.AddDays(-7));
        d3.Timeline.Add(Act(Dev003Id, ActivityType.Created,       "Deviation registered by eve.martin@example.com.",                                          "eve.martin@example.com",  null,              "Registered",         now.AddDays(-7)));
        d3.Timeline.Add(Act(Dev003Id, ActivityType.StatusChanged, "Status changed from 'Registered' to 'UnderAssessment'.",                                    "frank.lee@example.com",   "Registered",      "UnderAssessment",    now.AddDays(-6)));
        d3.Timeline.Add(Act(Dev003Id, ActivityType.StatusChanged, "Status changed from 'UnderAssessment' to 'UnderInvestigation'. Comment: CCTV footage under review.", "frank.lee@example.com", "UnderAssessment", "UnderInvestigation", now.AddDays(-4)));
        d3.Attachments.Add(Attach(Dev003Id, "spill-photo.jpg", "image/jpeg", "eve.martin@example.com", now.AddDays(-7)));
        yield return d3;

        // ── DEV-004 : UnderAssessment ─────────────────────────────────────
        var d4 = CloneWithTimestamp(new Deviation
        {
            Id          = Dev004Id,
            Title       = "Product dimensions out of tolerance – Run #PR-2024-089",
            Description = "Width measurement of component C-44 recorded at 47.8 mm vs specification of 48.0 ± 0.1 mm across 12 of 50 sampled units from run PR-2024-089.",
            Status      = DeviationStatus.UnderAssessment,
            Severity    = DeviationSeverity.Medium,
            Category    = DeviationCategory.Product,
            ReportedBy  = "grace.hall@example.com",
            AssignedTo  = "henry.clark@example.com",
            DueDate     = now.AddDays(10),
            Tags        = ["dimensions", "tolerance", "c-44"],
        }, now.AddDays(-3));
        d4.Timeline.Add(Act(Dev004Id, ActivityType.Created,       "Deviation registered by grace.hall@example.com.",                      "grace.hall@example.com",   null,         "Registered",      now.AddDays(-3)));
        d4.Timeline.Add(Act(Dev004Id, ActivityType.StatusChanged, "Status changed from 'Registered' to 'UnderAssessment'.",               "henry.clark@example.com",  "Registered", "UnderAssessment", now.AddDays(-2)));
        yield return d4;

        // ── DEV-005 : Registered ──────────────────────────────────────────
        var d5 = CloneWithTimestamp(new Deviation
        {
            Id          = Dev005Id,
            Title       = "Missing SOP documentation for process P-17",
            Description = "Standard Operating Procedure document for process P-17 (Acid Wash Cycle) could not be located in the document management system. Process has been running without validated SOP for an undetermined period.",
            Status      = DeviationStatus.Registered,
            Severity    = DeviationSeverity.Low,
            Category    = DeviationCategory.Process,
            ReportedBy  = "ivy.thomas@example.com",
            DueDate     = now.AddDays(21),
            Tags        = ["sop", "documentation", "p-17"],
        }, now.AddDays(-1));
        d5.Timeline.Add(Act(Dev005Id, ActivityType.Created, "Deviation registered by ivy.thomas@example.com.", "ivy.thomas@example.com", null, "Registered", now.AddDays(-1)));
        yield return d5;

        // ── DEV-006 : Registered ──────────────────────────────────────────
        var d6 = CloneWithTimestamp(new Deviation
        {
            Id          = Dev006Id,
            Title       = "Noise level exceeds regulatory threshold in Zone B",
            Description = "Noise monitoring in Zone B recorded peak levels of 92 dB(A) during shift 2 on 2024-12-10. Legal threshold is 85 dB(A). Three operators were present without hearing protection.",
            Status      = DeviationStatus.Registered,
            Severity    = DeviationSeverity.Medium,
            Category    = DeviationCategory.Environmental,
            ReportedBy  = "jack.evans@example.com",
            AssignedTo  = "karen.brown@example.com",
            DueDate     = now.AddDays(14),
            Tags        = ["noise", "zone-b", "ppe"],
        }, now);
        d6.Timeline.Add(Act(Dev006Id, ActivityType.Created, "Deviation registered by jack.evans@example.com.", "jack.evans@example.com", null, "Registered", now));
        yield return d6;
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a copy of <paramref name="src"/> with <c>CreatedAt</c> set via
    /// reflection (the only way to set an <c>init</c>-only property outside an
    /// object initialiser or constructor).
    /// </summary>
    private static Deviation CloneWithTimestamp(Deviation src, DateTimeOffset createdAt)
    {
        var d = new Deviation
        {
            Id               = src.Id,
            Title            = src.Title,
            Description      = src.Description,
            Status           = src.Status,
            Severity         = src.Severity,
            Category         = src.Category,
            ReportedBy       = src.ReportedBy,
            AssignedTo       = src.AssignedTo,
            DueDate          = src.DueDate,
            Tags             = src.Tags,
            RootCause        = src.RootCause,
            CorrectiveAction = src.CorrectiveAction,
            ClosureNotes     = src.ClosureNotes,
        };
        typeof(Deviation)
            .GetProperty(nameof(Deviation.CreatedAt))!
            .SetValue(d, createdAt);
        d.UpdatedAt = createdAt;
        return d;
    }

    private static DeviationActivity Act(
        Guid deviationId,
        ActivityType type,
        string description,
        string performedBy,
        string? previousStatus,
        string? newStatus,
        DateTimeOffset timestamp) => new()
        {
            DeviationId    = deviationId,
            Type           = type,
            Description    = description,
            PerformedBy    = performedBy,
            PreviousStatus = previousStatus,
            NewStatus      = newStatus,
            Timestamp      = timestamp,
        };

    private static DeviationAttachment Attach(
        Guid deviationId,
        string fileName,
        string contentType,
        string uploadedBy,
        DateTimeOffset uploadedAt)
    {
        // Tiny stub content – real files would come via the upload endpoint.
        var stub = System.Text.Encoding.UTF8.GetBytes($"[stub content for {fileName}]");
        return new DeviationAttachment
        {
            DeviationId = deviationId,
            FileName    = fileName,
            ContentType = contentType,
            SizeBytes   = stub.Length,
            UploadedBy  = uploadedBy,
            UploadedAt  = uploadedAt,
            Content     = stub,
        };
    }
}
