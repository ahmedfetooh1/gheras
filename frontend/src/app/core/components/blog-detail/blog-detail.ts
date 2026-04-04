import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BlogService } from '../../services/blogs';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-blog-detail',
  standalone: true, 
  imports: [CommonModule, RouterModule], 
  templateUrl: './blog-detail.html', 
  styleUrl: './blog-detail.css'      
})
export class BlogDetailComponent implements OnInit {
  [x: string]: any;
  blog: any;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.blogService.getBlogBySlug(slug).subscribe({
        next: (res: any) => {
          this.blog = res.data || res;
          this.cdr.detectChanges();
        },
        error: (err: any) => console.error(err)
      });
    }
  }
}