import { DeviationSeverity, DeviationStatus } from './deviation.model';

export interface DeviationForm {
  title: string;
  description: string;
  severity: DeviationSeverity;
  status: DeviationStatus;
  reportedBy: string;
  occurredAt: string;
}
