import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Deviation } from '../models/deviation.model';
import { DeviationForm } from '../models/deviation-form.model';

@Injectable({ providedIn: 'root' })
export class DeviationApiService {
  readonly #http = inject(HttpClient);
  readonly #base = `${environment.apiBaseUrl}/deviations`;

  getAll(): Observable<Deviation[]> {
    return this.#http.get<Deviation[]>(this.#base);
  }

  getById(id: string): Observable<Deviation> {
    return this.#http.get<Deviation>(`${this.#base}/${id}`);
  }

  create(payload: DeviationForm): Observable<Deviation> {
    return this.#http.post<Deviation>(this.#base, payload);
  }

  update(id: string, payload: DeviationForm): Observable<Deviation> {
    return this.#http.put<Deviation>(`${this.#base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.#http.delete<void>(`${this.#base}/${id}`);
  }
}
