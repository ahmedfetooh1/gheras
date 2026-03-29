import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Plant, Disease, Fertilizer } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class WikiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';

  // Plants
  getPlants(): Observable<Plant[]> {
    return this.http.get<any>(`${this.baseUrl}/plants`).pipe(
      map(res => res.data?.plants || [])
    );
  }

  getPlantById(id: string): Observable<Plant> {
    return this.http.get<any>(`${this.baseUrl}/plants/${id}`).pipe(
      map(res => res.data?.plant)  // هنا ناخد plant من data
    );
  }
  updatePlant(id: string, plantData: any, images: File[] = []): Observable<Plant> {
    const formData = new FormData();

    Object.keys(plantData).forEach(key => {
      formData.append(key, plantData[key]);
    });

    images.forEach(img => formData.append('images', img));

    return this.http.put<any>(`${this.baseUrl}/plants/${id}`, formData)
      .pipe(
        map(res => res.data.plant)
      );
  }

  // Diseases
  getDiseases(): Observable<Disease[]> {
    return this.http.get<any>(`${this.baseUrl}/diseases`)
      .pipe(
        map(res => res.data.diseases)
      );
  }

  getDiseaseById(id: string): Observable<Disease> {
    return this.http.get<any>(`${this.baseUrl}/diseases/${id}`)
      .pipe(
        map(res => res.data.disease)
      );
  }

  // Fertilizers
  getFertilizers(): Observable<Fertilizer[]> {
    return this.http.get<any>(`${this.baseUrl}/fertilizers`)
      .pipe(
        map(res => res.data.fertilizers)
      );
  }

  getFertilizerById(id: string): Observable<Fertilizer> {
    return this.http.get<any>(`${this.baseUrl}/fertilizers/${id}`)
      .pipe(
        map(res => res.data.fertilizer)
      );
  }


}