export type DeviationSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type DeviationStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

export interface Deviation {
  id: string;
  title: string;
  description: string;
  severity: DeviationSeverity;
  status: DeviationStatus;
  reportedBy: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}
