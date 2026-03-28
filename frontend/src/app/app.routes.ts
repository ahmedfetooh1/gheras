import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { Wiki } from './features/wiki/wiki';
import { Shop } from './features/shop/shop';
import { Forum } from './features/community/forum/forum';
import { Blog } from './features/community/blog/blog';
import { UserDashboard } from './features/dashboard/user-dashboard/user-dashboard';
import { AdminDashboard } from './features/dashboard/admin-dashboard/admin-dashboard';
import { SpecialistDashboard } from './features/dashboard/specialist-dashboard/specialist-dashboard';
import { PremiumDashboard } from './features/dashboard/premium-dashboard/premium-dashboard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'wiki', component: Wiki },
  { path: 'shop', component: Shop },
  { path: 'forum', component: Forum },
  { path: 'blog', component: Blog },
  { path: 'dashboard', component: UserDashboard, canActivate: [authGuard] },
  { path: 'dashboard/admin', component: AdminDashboard, canActivate: [authGuard, adminGuard] },
  { path: 'dashboard/specialist', component: SpecialistDashboard, canActivate: [authGuard] },
  { path: 'dashboard/premium', component: PremiumDashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
