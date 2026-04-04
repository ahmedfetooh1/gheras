# Gheras Angular App Implementation Plan

This plan documents the strategy for migrating the provided static HTML/CSS files into a functional Angular 17+ standalone application, along with integrating the existing Node.js/Express backend.

## User Review Required
No immediate blockers. I will propose the exact architecture after analyzing the backend routes and UI files.

## Proposed Changes
### Component Architecture
The Angular application will use Standalone components and will be structured as follows:

**1. Core Layout Components:**
- `NavbarComponent`: Application header and navigation.
- `FooterComponent`: Application footer.

**2. Feature Components (Pages):**
- `HomeComponent`: Landing page ([index.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/index.html)).
- `AuthComponent`: Login & Signup ([login.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/login.html), `register.html`).
- `WikiComponent`: Plant encyclopedia ([wiki.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/wiki.html)).
- `ShopComponent`: E-commerce layout ([shop.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/shop.html)).
- `ForumComponent`: Community forum ([forum.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/forum.html)).
- `BlogComponent`: Blog listing and posts ([blog.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/blog.html)).

**3. Dashboard Components:**
- `UserDashboardComponent`: Basic user features ([dashboard-user.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-user.html)).
- `PremiumDashboardComponent`: Extended features ([dashboard-premium.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-premium.html)).
- `AdminDashboardComponent`: Admin features ([dashboard-admin.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-admin.html)).
- `SpecialistDashboardComponent`: Specialist dashboard ([dashboard-specialist.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-specialist.html)).

### Services and Models
- **AuthService**: Handles `/api/users/login`, `/api/users/signup`, Google OAuth.
- **WikiService**: Handles `/api/plants`, `/api/diseases`, `/api/fertilizers`.
- **StoreService**: Handles `/api/product`, `/api/category`, `/api/cart`, `/api/orders`, `/api/payments`.
- **CommunityService**: Handles `/api/posts` (forum), `/api/comments`, and `/api` (blogs).
- **DashboardService**: Handles `/api/dashboard`, `/api/admin-dashboard`.


### Guards and Interceptors
- **AuthInterceptor**: Injects JWT token into outgoing HTTP requests.
- **AuthGuard**: Protects routes requiring user login (Cart, Dashboard, Checkout).
- **AdminGuard**: Protects `/admin-dashboard` ensuring the user has the 'admin' role.

## Verification Plan
1. Ensure the Angular dev server runs with `ng serve`.
2. Test authentication logic (login/signup) and JWT token storage.
3. Test protected route guards.
4. Verify Wiki, Shop, and Community data is dynamically fetched from `http://localhost:3000/api`.
5. Visual verification of styling matching the original templates perfectly.
