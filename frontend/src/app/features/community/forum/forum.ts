import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityService } from '../../../core/services/community.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { Post, Comment } from '../../../core/models/interfaces';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum.html',
  styleUrls: ['./forum.css'],
})
export class Forum implements OnInit {
  private communityService = inject(CommunityService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  posts = signal<Post[]>([]);
  loading = signal(true);
  error = signal('');

  // Comments state
  openCommentsPostId = signal<string | null>(null);
  commentsMap = signal<Record<string, Comment[]>>({});
  commentsLoading = signal<Record<string, boolean>>({});

  // New post modal
  showNewPostModal = signal(false);
  newPostTitle = '';
  newPostContent = '';
  submitting = signal(false);
  submitSuccess = signal(false);

  // Comment inputs
  newCommentText: Record<string, string> = {};
  submittingComment: Record<string, boolean> = {};
  expandedPosts: Record<string, boolean> = {};

  get currentUser() {
    return this.authService.currentUser();
  }

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);
    this.error.set('');
    this.communityService.getPosts().subscribe({
      next: (res: any) => {
        // Handle nested response data.posts or top level posts array
        const postsArray = res?.data?.posts || res?.posts || (Array.isArray(res) ? res : []);
        console.log('Forum: Loaded posts count:', postsArray.length);
        this.posts.set(postsArray);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Forum: Load error:', err);
        this.error.set('تعذّر تحميل البوستات، حاول مرة أخرى.');
        this.loading.set(false);
      }
    });
  }

  toggleComments(postId: string) {
    if (this.openCommentsPostId() === postId) {
      this.openCommentsPostId.set(null);
      return;
    }
    this.openCommentsPostId.set(postId);
    this.loadComments(postId);
  }

  loadComments(postId: string) {
    this.commentsLoading.update(m => ({ ...m, [postId]: true }));
    this.communityService.getComments(postId).subscribe({
      next: (res: any) => {
        const comments = res?.data?.comments ?? (Array.isArray(res) ? res : []);
        this.commentsMap.update(m => ({ ...m, [postId]: comments }));
        this.commentsLoading.update(m => ({ ...m, [postId]: false }));
      },
      error: () => {
        this.commentsMap.update(m => ({ ...m, [postId]: [] }));
        this.commentsLoading.update(m => ({ ...m, [postId]: false }));
      }
    });
  }

  getComments(postId: string): Comment[] {
    return this.commentsMap()[postId] ?? [];
  }

  isCommentsLoading(postId: string): boolean {
    return !!this.commentsLoading()[postId];
  }

  isCommentsOpen(postId: string): boolean {
    return this.openCommentsPostId() === postId;
  }

  isSubmittingComment(postId: string): boolean {
    return !!this.submittingComment[postId];
  }

  getCommentCount(post: Post): number {
    return Array.isArray(post.comments) ? post.comments.length : 0;
  }

  getAuthorName(author: any): string {
    if (!author) return 'مجهول';
    return (
      author.name ??
      author.username ??
      (`${author.firstName ?? ''} ${author.lastName ?? ''}`.trim())
    ) || 'مجهول';
  }

  getAuthorInitial(author: any): string {
    return this.getAuthorName(author).charAt(0).toUpperCase() || '؟';
  }

  openNewPost() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.alertService.warning('يجب تسجيل الدخول أولاً');
      return;
    }
    this.showNewPostModal.set(true);
  }

  submitPost() {
    if (!this.newPostTitle.trim() || !this.newPostContent.trim()) return;
    
    const authorId = this.authService.getUserId();
    
    if (!authorId) {
      console.error('Forum Debug: ID still null after all checks');
      this.alertService.warning('عذراً، يجب تسجيل الدخول مجدداً لنشر البوست');
      return;
    }
    
    this.submitting.set(true);
    const payload: any = {
      title: this.newPostTitle,
      content: this.newPostContent,
      author: authorId
    };
    this.communityService.createPost(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
        this.newPostTitle = '';
        this.newPostContent = '';
        setTimeout(() => {
          this.submitSuccess.set(false);
          this.showNewPostModal.set(false);
        }, 2000);
      },
      error: () => {
        this.submitting.set(false);
        this.alertService.error('حدث خطأ، حاول مرة أخرى');
      }
    });
  }

  closeModal() {
    this.showNewPostModal.set(false);
    this.newPostTitle = '';
    this.newPostContent = '';
    this.submitSuccess.set(false);
  }

submitComment(postId: string) {
  const text = this.newCommentText[postId]?.trim();
  if (!text) return;

  const authorId = this.authService.getUserId();
  if (!authorId) {
    this.alertService.warning('عذراً، يجب تسجيل الدخول مجدداً لإضافة تعليق');
    return;
  }
  this.submittingComment[postId] = true;

  this.communityService.addComment(postId, text, authorId).subscribe({
    next: (res: any) => {
      const newComment = res?.data?.comment ?? res;
      this.commentsMap.update(m => ({
        ...m,
        [postId]: [...(m[postId] ?? []), newComment]
      }));
      this.posts.update(posts =>
        posts.map(p =>
          p._id === postId
            ? { ...p, comments: [...(Array.isArray(p.comments) ? p.comments : []), newComment._id] }
            : p
        )
      );
      this.newCommentText[postId] = '';
      this.submittingComment[postId] = false;
    },
    error: (err) => {
      console.error(err);
      this.submittingComment[postId] = false;
    }
  });
}
}
