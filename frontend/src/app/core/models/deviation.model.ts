// ── Enums (string-union types mirroring C# enums) ───────────────────────────
export type DeviationType = 'Deviation' | 'NonConformance' | 'Incident' | 'NearMiss';
export type DeviationSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type DeviationStatus =
  | 'Registered'
  | 'Assessed'
  | 'Investigating'
  | 'CorrectiveAction'
  | 'Closed';
export type TimelineEventType =
  | 'Created'
  | 'StatusChange'
  | 'Comment'
  | 'AttachmentAdded'
  | 'AssigneeChanged';

// ── Core DTO ─────────────────────────────────────────────────────────────────
export interface DeviationDto {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  type: DeviationType;
  severity: DeviationSeverity;
  status: DeviationStatus;
  reportedBy: string;
  assignedTo: string | null;
  location: string;
  department: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;
  dueDate: string | null;
  closedAt: string | null;
  attachmentCount: number;
}

// ── Request / mutation shapes ─────────────────────────────────────────────────
export interface CreateDeviationRequest {
  title: string;
  description: string;
  type: DeviationType;
  severity: DeviationSeverity;
  location: string;
  department: string;
  reportedBy: string;
  dueDate?: string | null;
}

export interface UpdateDeviationRequest {
  title?: string;
  description?: string;
  severity?: DeviationSeverity;
  location?: string;
  department?: string;
  assignedTo?: string | null;
  dueDate?: string | null;
}

export interface AdvanceWorkflowRequest {
  notes: string;
  assignedTo?: string | null;
}

// ── Query & pagination ────────────────────────────────────────────────────────
export interface DeviationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DeviationStatus | '';
  severity?: DeviationSeverity | '';
  type?: DeviationType | '';
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Timeline ──────────────────────────────────────────────────────────────────
export interface TimelineEventDto {
  id: string;
  deviationId: string;
  eventType: TimelineEventType;
  description: string;
  performedBy: string;
  occurredAt: string; // ISO 8601 UTC
}

// ── Attachments ───────────────────────────────────────────────────────────────
export interface AttachmentDto {
  id: string;
  deviationId: string;
  fileName: string;
  fileSize: number; // bytes
  contentType: string;
  uploadedBy: string;
  uploadedAt: string; // ISO 8601 UTC
  url: string;
}

// ── Workflow metadata ─────────────────────────────────────────────────────────
export const WORKFLOW_STEPS: DeviationStatus[] = [
  'Registered',
  'Assessed',
  'Investigating',
  'CorrectiveAction',
  'Closed',
];

export const DEVIATION_TYPE_LABELS: Record<DeviationType, string> = {
  Deviation: 'Deviation',
  NonConformance: 'Non-Conformance',
  Incident: 'Incident',
  NearMiss: 'Near Miss',
};

export const DEVIATION_SEVERITY_LABELS: Record<DeviationSeverity, string> = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
};

export const DEVIATION_STATUS_LABELS: Record<DeviationStatus, string> = {
  Registered: 'Registered',
  Assessed: 'Assessed',
  Investigating: 'Investigating',
  CorrectiveAction: 'Corrective Action',
  Closed: 'Closed',
};

export const WORKFLOW_STEP_LABELS: Record<DeviationStatus, string> = {
  Registered: 'Register',
  Assessed: 'Assess',
  Investigating: 'Investigate',
  CorrectiveAction: 'Corrective Action',
  Closed: 'Close',
};

export const NEXT_STATUS_LABELS: Record<DeviationStatus, string> = {
  Registered: 'Mark as Assessed',
  Assessed: 'Begin Investigation',
  Investigating: 'Start Corrective Action',
  CorrectiveAction: 'Close Deviation',
  Closed: 'Closed',
};
