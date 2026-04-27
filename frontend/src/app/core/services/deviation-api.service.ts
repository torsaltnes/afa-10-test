import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Deviation, UpsertDeviationRequest } from '../models/deviation.model';

const BASE = '/api/deviations';

@Injectable({ providedIn: 'root' })
export class DeviationApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<Deviation[]> {
    return this.http.get<Deviation[]>(BASE);
  }

  getById(id: string): Observable<Deviation> {
    return this.http.get<Deviation>(`${BASE}/${id}`);
  }

  create(request: UpsertDeviationRequest): Observable<Deviation> {
    return this.http.post<Deviation>(BASE, request);
  }

  update(id: string, request: UpsertDeviationRequest & { id: string }): Observable<Deviation> {
    return this.http.put<Deviation>(`${BASE}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
