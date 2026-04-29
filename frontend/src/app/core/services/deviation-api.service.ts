import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttachmentDto,
  AdvanceWorkflowRequest,
  CreateDeviationRequest,
  DeviationDto,
  DeviationListQuery,
  PagedResult,
  TimelineEventDto,
  UpdateDeviationRequest,
} from '../models/deviation.model';

@Injectable({ providedIn: 'root' })
export class DeviationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/deviations`;

  list(query: DeviationListQuery = {}): Observable<PagedResult<DeviationDto>> {
    let params = new HttpParams();
    if (query.page != null) params = params.set('page', String(query.page));
    if (query.pageSize != null) params = params.set('pageSize', String(query.pageSize));
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.severity) params = params.set('severity', query.severity);
    if (query.type) params = params.set('type', query.type);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortDir) params = params.set('sortDir', query.sortDir);
    return this.http.get<PagedResult<DeviationDto>>(this.base, { params });
  }

  getById(id: string): Observable<DeviationDto> {
    return this.http.get<DeviationDto>(`${this.base}/${id}`);
  }

  create(request: CreateDeviationRequest): Observable<DeviationDto> {
    return this.http.post<DeviationDto>(this.base, request);
  }

  update(id: string, request: UpdateDeviationRequest): Observable<DeviationDto> {
    return this.http.put<DeviationDto>(`${this.base}/${id}`, request);
  }

  advance(id: string, request: AdvanceWorkflowRequest): Observable<DeviationDto> {
    return this.http.patch<DeviationDto>(`${this.base}/${id}/advance`, request);
  }

  getTimeline(id: string): Observable<TimelineEventDto[]> {
    return this.http.get<TimelineEventDto[]>(`${this.base}/${id}/timeline`);
  }

  getAttachments(id: string): Observable<AttachmentDto[]> {
    return this.http.get<AttachmentDto[]>(`${this.base}/${id}/attachments`);
  }

  uploadAttachment(id: string, file: File): Observable<AttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AttachmentDto>(`${this.base}/${id}/attachments`, formData);
  }

  deleteAttachment(id: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/attachments/${attachmentId}`);
  }

  exportCsv(query: DeviationListQuery = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.severity) params = params.set('severity', query.severity);
    if (query.type) params = params.set('type', query.type);
    return this.http.get(`${this.base}/export`, {
      params,
      responseType: 'blob',
    });
  }
}
