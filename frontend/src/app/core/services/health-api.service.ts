import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthStatusDto } from '../models/health-status.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  private readonly http = inject(HttpClient);

  getHealthStatus(): Observable<HealthStatusDto> {
    return this.http.get<HealthStatusDto>(`${environment.apiBaseUrl}/health`);
  }
}
