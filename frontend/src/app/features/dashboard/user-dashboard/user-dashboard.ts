import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  // User info
  userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.firstName || user?.username || user?.name || 'بك';
  });

  // Dashboard Data Signals
  myGarden = signal<any[]>([]);
  dashboardStats = signal<any>({ totalPlants: 0, alerts: 0 });
  notifications = signal<any[]>([]);
  showNotificationsDropdown = signal(false);
  dashboardLoading = signal(true);

  // Add Plant Modal State
  showAddPlantModal = false;
  selectedCategory = signal('');
  selectedPlantId = signal('');
  plantNickname = signal('');

  // Plant Details Drawer Logic
  showDetailsModal = signal(false);
  detailsLoading = signal(false);
  activeTab = signal('plan');
  selectedPlantDetails = signal<any>(null);

  // All plants fetched from DB
  allPlants = signal<any[]>([]);
  plantsLoading = false;

  // Computed signals for filtering
  categories = computed(() => {
    const plants = this.allPlants();
    const cats = new Set(plants.map(p => p.family).filter(f => !!f));
    return Array.from(cats).sort();
  });

  filteredPlants = computed(() => {
    const plants = this.allPlants();
    const category = this.selectedCategory();
    if (!category) return plants;
    return plants.filter(p => p.family === category);
  });

  ngOnInit() {
    this.loadDashboardData();
    this.loadPlants();
  }

  loadDashboardData() {
    this.dashboardLoading.set(true);
    // GET /api/dashboard returns { data: { myGarden, notifications, profile }, totalPlants, ... }
    this.http.get<any>('http://localhost:3000/api/dashboard').subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.myGarden.set(res.dashboardData?.myGarden || []);
          this.notifications.set(res.dashboardData?.notifications || []);
          this.dashboardStats.set({
            totalPlants: res.totalPlants || res.dashboardData?.myGarden?.length || 0,
            alerts: res.dashboardData?.notifications?.length || 0
          });
        }
        this.dashboardLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.dashboardLoading.set(false);
      }
    });
  }

  loadPlants() {
    this.plantsLoading = true;
    this.http.get<any>('http://localhost:3000/api/plants?limit=100').subscribe({
      next: (res) => {
        // GET /api/plants returns list or { data: { plants: [...] } }
        const plantsArray = res.data?.plants || res;
        this.allPlants.set(Array.isArray(plantsArray) ? plantsArray : []);
        this.plantsLoading = false;
      },
      error: (err) => {
        console.error('Error loading plants catalog:', err);
        this.plantsLoading = false;
      }
    });
  }

  onCategoryChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedCategory.set(selectElement.value);
    this.selectedPlantId.set(''); // Reset selected plant when category changes
  }

  onPlantChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedPlantId.set(selectElement.value);
  }

  openAddPlant() {
    this.showAddPlantModal = true;
    this.selectedCategory.set('');
    this.selectedPlantId.set('');
    this.plantNickname.set('');
  }

  closeAddPlant() {
    this.showAddPlantModal = false;
  }

  addPlant() {
    if (!this.selectedPlantId()) return;

    this.http.post<any>('http://localhost:3000/api/dashboard/add-plant', {
      plantId: this.selectedPlantId(),
      nickname: this.plantNickname() // Pass nickname if backend supports it eventually
    }).subscribe({
      next: (res) => {
        console.log('Plant added successfully:', res);
        this.closeAddPlant();
        // Refresh dashboard data instantly
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error adding plant:', err);
        const msg = err.error?.message || 'حدث خطأ أثناء إضافة النبتة. قد تكون وصلت للحد الأقصى أو النبتة موجودة بالفعل.';
        alert(msg);
      }
    });
  }

  toggleNotifications() {
    this.showNotificationsDropdown.update(v => !v);
  }

  waterPlant(id: string) {
    this.http.put<any>(`http://localhost:3000/api/dashboard/water-plant/${id}`, {}).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          // تحديث بيانات اللوحة بعد السقاية للحصول على التواريخ الجديدة
          this.loadDashboardData();
          
          // إذا كانت نافذة التفاصيل مفتوحة، يتم مراجعة بيانات نفس النبتة لتحديثها
          if (this.showDetailsModal() && this.selectedPlantDetails() && this.selectedPlantDetails()._id === id) {
             this.openPlantDetail(id);
          }
        }
      },
      error: (err) => {
        console.error('Error watering plant:', err);
        alert(err.error?.message || 'حدث خطأ أثناء محاولة سقاية النبتة.');
      }
    });
  }

  // Plant Details Drawer Logic
  openPlantDetail(id: string) {
    this.showDetailsModal.set(true);
    this.detailsLoading.set(true);
    this.activeTab.set('plan');

    this.http.get<any>(`http://localhost:3000/api/dashboard/my-plant/${id}`).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.selectedPlantDetails.set(res.data.userPlant);
        }
        this.detailsLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading plant details:', err);
        this.detailsLoading.set(false);
      }
    });
  }

  closePlantDetail() {
    this.showDetailsModal.set(false);
  }

  // Calculate percentage of growth stage (Mock logic or use from DB)
  getGrowthProgress(addedAt: string): number {
    const start = new Date(addedAt).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - start) / (1000 * 3600 * 24));
    // Assume 60 days standard harvest for visualization
    const percentage = Math.max(0, Math.min((diffDays / 60) * 100, 100));
    return Math.round(percentage);
  }

  // Calculate generic health status based on watering
  getHealthStatus(nextWatering: string): 'good' | 'warn' {
    if (!nextWatering) return 'good';
    const wateringDate = new Date(nextWatering).getTime();
    const now = new Date().getTime();
    return (wateringDate < now) ? 'warn' : 'good';
  }

  // Create an image URL
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000/${imagePath}`;
  }

  // Calculate generic next watering date fallback
  getCalculatedNextWatering(plantDetails: any): Date | null {
    if (!plantDetails) return null;
    // إذا كان الموعد موجوداً مباشرة من الداتابيز
    if (plantDetails.nextWateringDate) return new Date(plantDetails.nextWateringDate);
    
    // خلاف ذلك نحسبه بناءً على تاريخ آخر سقاية وعدد الأيام (frequency)
    const baseDateString = plantDetails.lastWateredDate || plantDetails.addedAt;
    if (!baseDateString) return null;

    const baseDate = new Date(baseDateString);
    const freq = plantDetails.plant?.waterNeeds?.frequency ? Number(plantDetails.plant.waterNeeds.frequency) : 0;
    
    if (freq > 0) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + freq);
      return nextDate;
    }
    
    return null;
  }
}

