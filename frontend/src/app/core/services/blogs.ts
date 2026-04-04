import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = 'http://localhost:3000/api/blogs'; // تأكد إن البورت صح

  constructor(private http: HttpClient) {}

  // جلب كل المقالات
  getBlogs(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // جلب مقال واحد بالـ slug
  getBlogBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${slug}`);
  }
}