# Gheras Angular Application Project

## Phase 1: Planning & Analysis
- [x] Analyze backend express routes and response structures.
- [x] Analyze provided HTML/CSS templates to plan component hierarchy.
- [x] Finalize Component and Service architecture.

## Phase 2: Setup & Configuration
- [ ] Verify Angular 17 standalone application setup.
- [ ] Setup application routing (Auth, Wiki, Shop, Community, Dashboard).
- [ ] Configure `HttpClient` and HTTP Interceptor for JWT authentication.
- [ ] Setup global styles and copy assets from UI template.

## Phase 3: Models & Services Integration
- [ ] Create Typescript Interfaces for:
  - [ ] User (Auth profile)
  - [ ] Plant, Disease, Fertilizer
  - [ ] Product, Category, Cart, Order
  - [ ] Post, Comment
  - [ ] Blog
- [ ] Create Angular Services:
  - [ ] `AuthService` (/users logic)
  - [ ] `WikiService` (/plants, /diseases, /fertilizers)
  - [ ] `StoreService` (/product, /category, /cart, /orders, /payments)
  - [ ] `CommunityService` (/posts, /comments, /blogs)
  - [ ] `DashboardService` (/dashboard logic, add-plant, admin stats)

## Phase 4: Component Implementation
- [ ] Implemement Shared Components (Navbar, Footer, Modals).
- [ ] Implement Home & Authentication components ([index.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/index.html), [login.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/login.html)).
- [ ] Implement Wiki components ([wiki.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/wiki.html)).
- [ ] Implement Shop components ([shop.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/shop.html)).
- [ ] Implement Community components ([forum.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/forum.html), [blog.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/blog.html)).
- [ ] Implement Dashboard components:
  - [ ] User Dashboard ([dashboard-user.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-user.html), [dashboard-premium.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-premium.html)).
  - [ ] Admin Dashboard ([dashboard-admin.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-admin.html)).
  - [ ] Specialist Dashboard ([dashboard-specialist.html](file:///C:/Users/ENG%20Ahmed%20Fetooh/Desktop/Nti_final_project/UI/dashboard-specialist.html)).

## Phase 5: Routing & Guards
- [ ] Implement `authGuard` for protected routes.
- [ ] Implement `adminGuard` for `/admin-dashboard` routes.
- [ ] Implement role-based access for premium user dashboard features.

## Phase 6: Refinement & Testing
- [ ] Ensure dynamic data binding with `*ngFor` and `[(ngModel)]`/Reactive Forms.
- [ ] Implement Search & Filter logic for Wiki and Store.
- [ ] Implement real-time cart badge updates.
- [ ] Validate Admin functionalities.
