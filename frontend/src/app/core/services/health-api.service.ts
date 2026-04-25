import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthStatus } from '../models/health-status.model';

@Injectable({
  providedIn: 'root'
})
export class HealthApiService {
  private readonly http = inject(HttpClient);

  getHealthStatus(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>('/api/health');
  }
}
