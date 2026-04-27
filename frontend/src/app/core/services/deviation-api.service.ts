import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateDeviationPayload,
  DeviationModel,
  UpdateDeviationPayload,
} from '../models/deviation.model';

@Injectable({ providedIn: 'root' })
export class DeviationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/deviations';

  getAll(): Observable<DeviationModel[]> {
    return this.http.get<DeviationModel[]>(this.baseUrl);
  }

  getById(id: string): Observable<DeviationModel> {
    return this.http.get<DeviationModel>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateDeviationPayload): Observable<DeviationModel> {
    return this.http.post<DeviationModel>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateDeviationPayload): Observable<DeviationModel> {
    return this.http.put<DeviationModel>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
