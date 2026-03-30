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

  updateProductAdmin(id: string, data: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/product/${id}`, data);
  }

  deleteProductAdmin(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/product/${id}`);
  }

  addCategoryAdmin(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/category`, data);
  }

  // Edit/List Methods
  updatePlantAdmin(id: string, data: FormData | any): Observable<any> {
    return this.http.put(`${this.baseUrl}/plants/${id}`, data);
  }

  deletePlantAdmin(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/plants/${id}`);
  }

  // Disease Admin
  updateDiseaseAdmin(id: string, data: FormData | any): Observable<any> {
    return this.http.put(`${this.baseUrl}/diseases/${id}`, data);
  }

  deleteDiseaseAdmin(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/diseases/${id}`);
  }

  // Fertilizer Admin
  updateFertilizerAdmin(id: string, data: FormData | any): Observable<any> {
    return this.http.put(`${this.baseUrl}/fertilizers/${id}`, data);
  }

  deleteFertilizerAdmin(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/fertilizers/${id}`);
  }

  getUsersAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }

  deleteUserAdmin(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`);
  }
}
