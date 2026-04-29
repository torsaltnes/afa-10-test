/**
 * HealthState union type — mirrors the C# HealthState enum serialized as string.
 */
export type HealthState = 'Healthy' | 'Degraded' | 'Unhealthy';

/**
 * HealthStatusDto — mirrors the backend GET /health response contract.
 */
export interface HealthStatusDto {
  status: HealthState;
  serviceName: string;
  environment: string;
  version: string;
  timestampUtc: string; // ISO 8601 UTC string (C# DateTimeOffset)
}
