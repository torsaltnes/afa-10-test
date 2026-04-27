import { DeviationSeverity } from './deviation-severity.type';
import { DeviationStatus } from './deviation-status.type';

export interface DeviationModel {
  id: string;
  title: string;
  description: string;
  severity: DeviationSeverity;
  status: DeviationStatus;
  reportedBy: string;
  reportedAt: string;
  updatedAt: string;
}

export interface CreateDeviationPayload {
  title: string;
  description: string;
  severity: DeviationSeverity;
  status: DeviationStatus;
  reportedBy: string;
}

export interface UpdateDeviationPayload {
  title: string;
  description: string;
  severity: DeviationSeverity;
  status: DeviationStatus;
  reportedBy: string;
}
