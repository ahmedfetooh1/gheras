import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, Comment, Blog } from '../models/interfaces';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  getPosts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/posts`);
  }

  getPendingPosts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/posts/pending`, this.getAuthHeaders());
  }

  approvePost(postId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/posts/approve/${postId}`, {}, this.getAuthHeaders());
  }

  rejectPost(postId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/posts/reject/${postId}`, {}, this.getAuthHeaders());
  }

  createPost(post: Partial<Post>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/posts`, post, this.getAuthHeaders());
  }

  getComments(postId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/comments/post/${postId}`);
  }

  addComment(postId: string, text: string, authorId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/comments`, { text, author: authorId, post: postId }, this.getAuthHeaders());
  }

  getBlogs(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/blogs`);
  }

  getBlogBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/blogs/${slug}`);
  }
}
