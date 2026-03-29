import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats, Plant } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api';

  getUserDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard`);
  }

  addUserPlant(plantData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/dashboard/add-plant`, plantData);
  }

  getAdminStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/admin-dashboard`);
  }

  getAllOrders(): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders/admin/all`);
  }

  // Admin Add Methods
  addPlantAdmin(data: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/plants`, data);
  }

  addDiseaseAdmin(data: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/diseases`, data);
  }

  addFertilizerAdmin(data: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/fertilizers`, data);
  }

  addProductAdmin(data: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/product/add`, data);
  }

  addCategoryAdmin(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/category`, data);
  }
}
