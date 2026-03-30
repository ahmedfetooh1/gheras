import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WikiResponse {
  status: string;
  page: number;
  total: number;
  totalPages: number;
  data: {
    plants?: any[];
    diseases?: any[];
    fertilizers?: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class WikiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000'; // Root URL for static files

  getPlants(page: number = 1, limit: number = 15): Observable<WikiResponse> {
    return this.http.get<WikiResponse>(`${this.baseUrl}/api/plants?page=${page}&limit=${limit}`);
  }

  getDiseases(page: number = 1, limit: number = 15): Observable<WikiResponse> {
    return this.http.get<WikiResponse>(`${this.baseUrl}/api/diseases?page=${page}&limit=${limit}`);
  }

  getFertilizers(page: number = 1, limit: number = 15): Observable<WikiResponse> {
    return this.http.get<WikiResponse>(`${this.baseUrl}/api/fertilizers?page=${page}&limit=${limit}`);
  }

  getPlantById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/plants/${id}`);
  }

  getDiseaseById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/diseases/${id}`);
  }

  getFertilizerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/fertilizers/${id}`);
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Ensure path doesn't start with / before adding it
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }
}