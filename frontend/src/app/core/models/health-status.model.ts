export interface HealthStatus {
  status: string;
  serviceName: string;
  version: string;
  environment: string;
  checkedAtUtc: string;
}
