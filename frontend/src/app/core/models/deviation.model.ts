export type DeviationSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type DeviationStatus = 'Open' | 'Investigating' | 'Resolved' | 'Closed';

export interface Deviation {
  id: string;
  title: string;
  description: string;
  severity: DeviationSeverity;
  status: DeviationStatus;
  createdAtUtc: string;
  lastModifiedAtUtc: string;
}

export interface UpsertDeviationRequest {
  title: string;
  description: string;
  severity: DeviationSeverity;
  status?: DeviationStatus;
}

export const DEVIATION_SEVERITIES: DeviationSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
export const DEVIATION_STATUSES: DeviationStatus[] = ['Open', 'Investigating', 'Resolved', 'Closed'];
