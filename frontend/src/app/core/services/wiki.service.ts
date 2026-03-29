import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plant, Disease, Fertilizer } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class WikiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';

  getPlants(): Observable<Plant[]> {
    return this.http.get<Plant[]>(`${this.baseUrl}/plants`);
  }

  getDiseases(): Observable<Disease[]> {
    return this.http.get<Disease[]>(`${this.baseUrl}/diseases`);
  }

  getFertilizers(): Observable<Fertilizer[]> {
    return this.http.get<Fertilizer[]>(`${this.baseUrl}/fertilizers`);
  }
}
