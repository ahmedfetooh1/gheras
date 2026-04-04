import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService } from '../../../core/services/blogs';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './blog.html',
  styleUrl: './blog.css' 
})
export class Blog implements OnInit {
  blogs: any[] = []; 

  constructor(private blogService: BlogService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.blogService.getBlogs().subscribe({
      next: (res: any) => {
        console.log("Blogs list:", res);
        let extracted = res.data ? res.data : res;
        this.blogs = Array.isArray(extracted) ? extracted : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}