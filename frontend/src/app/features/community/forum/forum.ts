// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { CommunityService } from '../../../core/services/community.service';
// import { AuthService } from '../../../core/services/auth.service';
// import { Post, Comment } from '../../../core/models/interfaces';


// @Component({
//   selector: 'app-forum',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './forum.html',
//   styleUrls: ['./forum.css'],
// })
// export class Forum implements OnInit {
//   private communityService = inject(CommunityService);
//   private authService = inject(AuthService);

//   posts = signal<Post[]>([]);
//   loading = signal(true);
//   error = signal('');

//   // Comments state
//   openCommentsPostId = signal<string | null>(null);
//   commentsMap = signal<Record<string, Comment[]>>({});
//   commentsLoading = signal<Record<string, boolean>>({});

//   // New post modal
//   showNewPostModal = signal(false);
//   newPostTitle = '';
//   newPostContent = '';
//   submitting = signal(false);
//   submitSuccess = signal(false);

//   get currentUser() {
//     return this.authService.currentUser();
//   }

//   ngOnInit() {
//     this.loadPosts();
//   }

//   loadPosts() {
//     this.loading.set(true);
//     this.error.set('');
//     this.communityService.getPosts().subscribe({
//       next: (res: any) => {
//         // Handle both wrapped { data: { posts: [] } } and plain array
//         const posts = res?.data?.posts ?? res?.posts ?? (Array.isArray(res) ? res : []);
//         this.posts.set(posts);
//         this.loading.set(false);
//       },
//       error: () => {
//         this.error.set('تعذّر تحميل البوستات، حاول مرة أخرى.');
//         this.loading.set(false);
//       }
//     });
//   }

//   toggleComments(postId: string) {
//     if (this.openCommentsPostId() === postId) {
//       this.openCommentsPostId.set(null);
//       return;
//     }
//     this.openCommentsPostId.set(postId);
//     if (!this.commentsMap()[postId]) {
//       this.commentsLoading.update((m: any) => ({ ...m, [postId]: true }));
//       this.communityService.getComments(postId).subscribe({
//         next: (res: any) => {
//           const comments = res?.data?.comments ?? (Array.isArray(res) ? res : []);
//           this.commentsMap.update((m: any) => ({ ...m, [postId]: comments }));
//           this.commentsLoading.update((m: any) => ({ ...m, [postId]: false }));
//         },
//         error: () => {
//           this.commentsMap.update((m: any) => ({ ...m, [postId]: [] }));
//           this.commentsLoading.update((m: any) => ({ ...m, [postId]: false }));
//         }
//       });
//     }
//   }

//   getComments(postId: string): Comment[] {
//     return this.commentsMap()[postId] ?? [];
//   }

//   isCommentsLoading(postId: string): boolean {
//     return !!this.commentsLoading()[postId];
//   }

//   isCommentsOpen(postId: string): boolean {
//     return this.openCommentsPostId() === postId;
//   }

//   getCommentCount(post: Post): number {
//     return Array.isArray(post.comments) ? post.comments.length : 0;
//   }

//   getAuthorName(author: any): string {
//     if (!author) return 'مجهول';
//     return (
//   author.name ??
//   author.username ??
//   (`${author.firstName ?? ''} ${author.lastName ?? ''}`.trim())
// ) || 'مجهول';
//   }

//   getAuthorInitial(author: any): string {
//     return this.getAuthorName(author).charAt(0).toUpperCase() || '؟';
//   }

//   openNewPost() {
//     if (!this.currentUser) {
//       alert('يجب تسجيل الدخول أولاً');
//       return;
//     }
//     this.showNewPostModal.set(true);
//   }

//   submitPost() {
//     if (!this.newPostTitle.trim() || !this.newPostContent.trim()) return;
//     this.submitting.set(true);
//     const payload: Partial<Post> = {
//       title: this.newPostTitle,
//       content: this.newPostContent,
//     };
//     this.communityService.createPost(payload).subscribe({
//       next: () => {
//         this.submitting.set(false);
//         this.submitSuccess.set(true);
//         this.newPostTitle = '';
//         this.newPostContent = '';
//         setTimeout(() => {
//           this.submitSuccess.set(false);
//           this.showNewPostModal.set(false);
//         }, 2000);
//       },
//       error: () => {
//         this.submitting.set(false);
//         alert('حدث خطأ، حاول مرة أخرى');
//       }
//     });
//   }

//   closeModal() {
//     this.showNewPostModal.set(false);
//     this.newPostTitle = '';
//     this.newPostContent = '';
//     this.submitSuccess.set(false);
//   }

//   newCommentText: Record<string, string> = {};
// submittingComment: Record<string, boolean> = {};

// isSubmittingComment(postId: string): boolean {
//   return !!this.submittingComment[postId];
// }

// submitComment(postId: string) {
//   const text = this.newCommentText[postId]?.trim();
//   if (!text) return;

//   const authorId = this.authService.currentUser()?.id;
//   this.submittingComment[postId] = true;

//   const comment: Partial<Comment> = {
//     content: text,
//     author: this.authService.currentUser()
//   };
//   this.communityService.addComment(comment).subscribe({
//     next: () => {
//       this.newCommentText[postId] = '';
//       this.submittingComment[postId] = false;
//       this.toggleComments(postId);
//     },
//     error: (err) => {
//       console.error(err);
//       this.submittingComment[postId] = false;
//     }
//   });
// }
// }

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityService } from '../../../core/services/community.service';
import { AuthService } from '../../../core/services/auth.service';
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
        const posts = res?.data?.posts ?? res?.posts ?? (Array.isArray(res) ? res : []);
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => {
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

  // ✅ method مستقلة لتحميل الكومنتس
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
    if (!this.currentUser) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }
    this.showNewPostModal.set(true);
  }

  submitPost() {
    if (!this.newPostTitle.trim() || !this.newPostContent.trim()) return;
    
    const authorId = this.authService.currentUser()?.id;
    if (!authorId) {
      alert('يجب تسجيل الدخول أولاً');
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
        alert('حدث خطأ، حاول مرة أخرى');
      }
    });
  }

  closeModal() {
    this.showNewPostModal.set(false);
    this.newPostTitle = '';
    this.newPostContent = '';
    this.submitSuccess.set(false);
  }

  // ✅ اتعدلت
submitComment(postId: string) {
  const text = this.newCommentText[postId]?.trim();
  if (!text) return;

  const authorId = this.authService.currentUser()?.id;
  if (!authorId) {
    alert('يجب تسجيل الدخول أولاً');
    return;
  }
  this.submittingComment[postId] = true;

  this.communityService.addComment(postId, text, authorId).subscribe({
    next: (res: any) => {
      // ✅ جيب الكومنت الجديد من الـ response
      const newComment = res?.data?.comment ?? res;

      // ✅ أضيفه على طول في الـ commentsMap من غير ما تعيد تحميل
      this.commentsMap.update(m => ({
        ...m,
        [postId]: [...(m[postId] ?? []), newComment]
      }));

      // ✅ زود عدد الكومنتس على البوست
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
