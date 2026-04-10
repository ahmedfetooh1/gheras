import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../../core/services/dashboard.service';
import { WikiService } from '../../../core/services/wiki.service';
import { CommunityService } from '../../../core/services/community.service';
import { AlertService } from '../../../core/services/alert.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private wikiService = inject(WikiService);
  private communityService = inject(CommunityService);
  private alertService = inject(AlertService);
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';
  private cdr = inject(ChangeDetectorRef);

  activeView: string = 'stats';

  // Forum Moderation
  pendingPosts: any[] = [];
  loadingPending = false;

  // Orders Management
  allOrders: any[] = [];
  loadingOrders = false;
  statusMap: any = {
    'pending': { label: 'معلق', class: 'badge-amber' },
    'paid': { label: 'تم الدفع', class: 'badge-green' },
    'confirmed': { label: 'تم الدفع', class: 'badge-green' },
    'processing': { label: 'تم الدفع', class: 'badge-green' },
    'shipped': { label: 'تم الدفع', class: 'badge-green' },
    'delivered': { label: 'مكتمل', class: 'badge-green' },
    'cancelled': { label: 'ملغي', class: 'badge-red' }
  };

  // Collapse states
  expandedSections: { [key: string]: boolean } = {
    plantManagement: true,
    plants: false,
    diseases: false,
    fertilizers: false,
    productManagement: true,
    contentManagement: true
  };

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  // -------------------- lists for linking --------------------
  allPlants: any[] = [];
  allDiseases: any[] = [];
  allFertilizers: any[] = [];
  allCategories: any[] = [];
  selectedDiseaseIds: string[] = [];
  selectedFertilizerIds: string[] = [];

  // ==================== EDIT/DELETE PLANT ====================
  selectedPlantId: string = '';
  plantToDeleteId: string = '';

  // ==================== EDIT/DELETE DISEASE ====================
  selectedDiseaseId: string = '';
  diseaseToDeleteId: string = '';

  // ==================== EDIT/DELETE FERTILIZER ====================
  selectedFertilizerId: string = '';
  fertilizerToDeleteId: string = '';

  // ==================== EDIT/DELETE PRODUCT ====================
  allProducts: any[] = [];
  selectedProductId: string = '';
  productToDeleteId: string = '';

  // ==================== USER MANAGEMENT ====================
  allUsers: any[] = [];

  // ==================== CUSTOM CONFIRM MODAL ====================
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmAction: (() => void) | null = null;
  confirmButtonText = 'تأكيد';
  confirmButtonClass = 'btn-primary';

  openConfirmDialog(title: string, message: string, btnText: string, btnClass: string, action: () => void) {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmButtonText = btnText;
    this.confirmButtonClass = btnClass;
    this.confirmAction = action;
    this.showConfirmModal = true;
  }

  closeConfirmDialog() {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }

  executeConfirmDialog() {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.closeConfirmDialog();
  }

  get regularUsers() {
    return this.allUsers.filter(u => u.role !== 'admin');
  }

  get adminUsers() {
    return this.allUsers.filter(u => u.role === 'admin');
  }

  get premiumCount(): number {
    return this.allUsers.filter(u => u.premium === true).length;
  }

  deletePlant() {
    if (!this.plantToDeleteId) {
      this.alertService.warning('الرجاء اختيار نبات لحذفه أولاً');
      return;
    }

    const plant = this.allPlants.find(p => (p._id || p.id) === this.plantToDeleteId);
    const plantName = plant ? (plant.commonName || plant.name) : 'هذا النبات';

    if (confirm(`هل أنت متأكد من رغبتك في حذف "${plantName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      this.dashboardService.deletePlantAdmin(this.plantToDeleteId).subscribe({
        next: () => {
          this.alertService.success('تم حذف النبات بنجاح 🗑️');
          this.plantToDeleteId = '';
          this.loadAllData();
          this.setView('stats');
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.alertService.error('حدث خطأ أثناء الحذف: ' + (err.error?.message || 'تأكد من صلاحياتك أو اتصالك بالسيرفر'));
        }
      });
    }
  }

  deleteDisease() {
    if (!this.diseaseToDeleteId) {
      this.alertService.warning('الرجاء اختيار مرض لحذفه أولاً');
      return;
    }

    const disease = this.allDiseases.find(d => (d._id || d.id) === this.diseaseToDeleteId);
    const diseaseName = disease ? disease.name : 'هذا المرض';

    if (confirm(`هل أنت متأكد من رغبتك في حذف "${diseaseName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      this.dashboardService.deleteDiseaseAdmin(this.diseaseToDeleteId).subscribe({
        next: () => {
          this.alertService.success('تم حذف المرض بنجاح 🗑️');
          this.diseaseToDeleteId = '';
          this.loadAllData();
          this.setView('stats');
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.alertService.error('حدث خطأ أثناء الحذف: ' + (err.error?.message || 'تأكد من صلاحياتك'));
        }
      });
    }
  }

  deleteFertilizer() {
    if (!this.fertilizerToDeleteId) {
      this.alertService.warning('الرجاء اختيار سماد لحذفه أولاً');
      return;
    }

    const fert = this.allFertilizers.find(f => (f._id || f.id) === this.fertilizerToDeleteId);
    const fertName = fert ? fert.name : 'هذا السماد';

    if (confirm(`هل أنت متأكد من رغبتك في حذف "${fertName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      this.dashboardService.deleteFertilizerAdmin(this.fertilizerToDeleteId).subscribe({
        next: () => {
          this.alertService.success('تم حذف السماد بنجاح 🗑️');
          this.fertilizerToDeleteId = '';
          this.loadAllData();
          this.setView('stats');
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.alertService.error('حدث خطأ أثناء الحذف: ' + (err.error?.message || 'تأكد من صلاحياتك'));
        }
      });
    }
  }

  deleteProduct() {
    if (!this.productToDeleteId) {
      this.alertService.warning('الرجاء اختيار منتج لحذفه أولاً');
      return;
    }
    const product = this.allProducts.find(p => (p._id || p.id) === this.productToDeleteId);
    const productName = product ? product.name : 'هذا المنتج';

    if (confirm(`هل أنت متأكد من رغبتك في حذف "${productName}"؟`)) {
      this.dashboardService.deleteProductAdmin(this.productToDeleteId).subscribe({
        next: () => {
          this.alertService.success('تم حذف المنتج بنجاح 🗑️');
          this.productToDeleteId = '';
          this.loadAllData();
          this.setView('stats');
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.alertService.error('حدث خطأ أثناء الحذف');
        }
      });
    }
  }

  deleteUser(userId: string, userName: string) {
    if (confirm(`هل أنت متأكد من رغبتك في حذف المستخدم "${userName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      this.dashboardService.deleteUserAdmin(userId).subscribe({
        next: () => {
          this.alertService.success('تم حذف المستخدم بنجاح 🗑️');
          // Update local list instantly without refresh
          this.allUsers = this.allUsers.filter(u => (u._id || u.id) !== userId);
          // Refresh total counts
          this.loadAllData();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Delete user error:', err);
          this.alertService.error('حدث خطأ أثناء حذف المستخدم: ' + (err.error?.message || 'تأكد من الصلاحيات'));
        }
      });
    }
  }

  // -------------------- PLANT FORM --------------------
  plantForm: any = {
    commonName: '', scientificName: '', family: '', description: '',
    growingSeason: '', temperatureMin: null, temperatureMax: null,
    sunlightHours: null, soilPHMin: null, soilPHMax: null,
    waterLevel: '', waterFrequency: null, nutritionalValue: '',
    potSizeOptions: [],
    growthStages: []
  };
  plantImages: File[] = [];

  // -------------------- DISEASE FORM --------------------
  diseaseForm: any = {
    name: '', scientificName: '', pathogenType: '',
    favorableConditions: '',
    symptomsText: '',      // user types one per line
    preventionText: '',
    treatmentText: ''
  };
  diseaseImage: File | null = null;

  // -------------------- FERTILIZER FORM --------------------
  fertilizerForm: any = {
    name: '', type: '',
    applicationMethod: '', applicationRate: '',
    benefitsText: '',        // one per line
    compositionText: ''      // format: "عنصر:نسبة" per line
  };
  fertilizerImage: File | null = null;

  // -------------------- PRODUCT FORM --------------------
  productForm: any = { name: '', description: '', category: '', price: 0, costPrice: 0, discountPercent: 0, stock: 0 };
  productImages: File[] = [];

  // -------------------- CATEGORY FORM --------------------
  categoryForm: any = { name: '', slug: '', description: '' };

  // ==================== INIT ====================
  adminStats: any = null;
  currentDate: Date = new Date();

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.dashboardService.getAdminStats().subscribe({
      next: (res: any) => {
        console.log('Admin Stats Response:', res); // لتشوف الشكل الحقيقي
        this.adminStats = res?.stats || res?.data || res || null;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error('Error fetching admin stats:', err); }
    });

    this.loadPendingPosts();

    this.wikiService.getPlants(1, 200).subscribe({
      next: (res: any) => {
        this.allPlants = res?.data?.plants || res?.data || res || [];
      },
      error: (err) => { console.error('Error fetching plants:', err); }
    });
    this.wikiService.getDiseases(1, 100).subscribe({
      next: (res: any) => {
        this.allDiseases = res?.data?.diseases || res?.data || res || [];
      },
      error: (err) => { console.error('Error fetching diseases:', err); }
    });
    this.wikiService.getFertilizers(1, 100).subscribe({
      next: (res: any) => {
        this.allFertilizers = res?.data?.fertilizers || res?.data || res || [];
      },
      error: (err) => { console.error('Error fetching fertilizers:', err); }
    });
    this.http.get<any>(`${this.base}/category`).subscribe({
      next: (res: any) => { this.allCategories = res?.data || res || []; },
      error: () => { }
    });
    this.http.get<any>(`${this.base}/product`).subscribe({
      next: (res: any) => { this.allProducts = res?.data || res || []; },
      error: () => { }
    });
    this.dashboardService.getUsersAdmin().subscribe({
      next: (res: any) => { this.allUsers = res?.data || res || []; },
      error: (err) => { console.error('Error fetching users:', err); }
    });

    this.loadOrders();
  }

  loadOrders() {
    this.loadingOrders = true;
    this.dashboardService.getAllOrders().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        this.allOrders = Array.isArray(data) ? data : [];
        this.loadingOrders = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.loadingOrders = false;
      }
    });
  }

  updateOrderStatus(orderId: string, event: any) {
    const newStatus = event.target.value;
    if (!newStatus) return;
    this.changeStatus(orderId, newStatus);
  }

  changeStatus(orderId: string, newStatus: string) {
    this.dashboardService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.alertService.success('تم تحديث حالة الطلب بنجاح ✅');
        this.loadOrders();
        this.loadAllData();
      },
      error: (err) => {
        console.error('Update status error:', err);
        this.alertService.error('حدث خطأ أثناء تحديث حالة الطلب: ' + (err.error?.message || 'تأكد من صلاحياتك'));
      }
    });
  }

  getOrderItemsSummary(items: any[]): string {
    if (!items || items.length === 0) return 'لا يوجد منتجات';
    return items.map(item => `${item.name} × ${item.quantity}`).join(' ، ');
  }

  getStatusClass(status: string): string {
    return this.statusMap[status]?.class || 'badge-amber';
  }

  getStatusLabel(status: string): string {
    return this.statusMap[status]?.label || status;
  }

  setView(view: string) {
    this.activeView = view;
    this.resetPlantForm();
    this.resetDiseaseForm();
    this.resetFertilizerForm();
    this.resetProductForm(); // ريست للفورم عند تغيير الواجهة
    this.loadAllData();
  }

  // ==================== FILE CHANGE ====================
  onFileChange(event: any, type: string) {
    if (event.target.files && event.target.files.length > 0) {
      if (type === 'plant' || type === 'product') {
        const files = Array.from(event.target.files) as File[];
        type === 'plant' ? this.plantImages = files : this.productImages = files;
      } else {
        const file = event.target.files[0];
        type === 'disease' ? this.diseaseImage = file : this.fertilizerImage = file;
      }
    }
  }

  // ==================== TOGGLE DISEASE / FERTILIZER SELECTION ====================
  toggleDisease(id: string) {
    const idx = this.selectedDiseaseIds.indexOf(id);
    idx === -1 ? this.selectedDiseaseIds.push(id) : this.selectedDiseaseIds.splice(idx, 1);
  }
  toggleFertilizer(id: string) {
    const idx = this.selectedFertilizerIds.indexOf(id);
    idx === -1 ? this.selectedFertilizerIds.push(id) : this.selectedFertilizerIds.splice(idx, 1);
  }
  isSelectedDisease(id: string) { return this.selectedDiseaseIds.includes(id); }
  isSelectedFertilizer(id: string) { return this.selectedFertilizerIds.includes(id); }

  // helper: split textarea lines to array
  private lines(text: string): string[] {
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  }

  // ==================== SUBMIT PLANT ====================
  submitPlant(isUpdate: boolean = false) {
    if (!this.plantForm.commonName?.trim() || !this.plantForm.scientificName?.trim() || !this.plantForm.family?.trim()) {
      this.alertService.warning('الرجاء ملء الحقول الأساسية: الاسم الشائع، الاسم العلمي، والفصيلة');
      return;
    }
    const body: any = {
      commonName: this.plantForm.commonName,
      scientificName: this.plantForm.scientificName,
    };
    if (this.plantForm.family) body.family = this.plantForm.family;
    if (this.plantForm.description) body.description = this.plantForm.description;
    if (this.plantForm.growingSeason) body.growingSeason = this.plantForm.growingSeason;
    if (this.plantForm.temperatureMin != null || this.plantForm.temperatureMax != null) {
      body.temperatureRange = { min: this.plantForm.temperatureMin, max: this.plantForm.temperatureMax };
    }
    if (this.plantForm.sunlightHours != null) body.sunlightHours = this.plantForm.sunlightHours;
    if (this.plantForm.soilPHMin != null || this.plantForm.soilPHMax != null) {
      body.soilPH = { min: this.plantForm.soilPHMin, max: this.plantForm.soilPHMax };
    }
    if (this.plantForm.waterLevel || this.plantForm.waterFrequency != null) {
      body.waterNeeds = { level: this.plantForm.waterLevel, frequency: this.plantForm.waterFrequency };
    }
    if (this.plantForm.nutritionalValue) body.nutritionalValue = this.plantForm.nutritionalValue;

    // arrays
    if (this.selectedDiseaseIds.length > 0) body.diseases = this.selectedDiseaseIds;
    if (this.selectedFertilizerIds.length > 0) body.fertilizers = this.selectedFertilizerIds;
    if (this.plantForm.potSizeOptions?.length > 0) body.potSizeOptions = this.plantForm.potSizeOptions;
    if (this.plantForm.growthStages?.length > 0) body.growthStages = this.plantForm.growthStages;

    // DETERMINING DATA TO SEND (JSON OR FORMDATA)
    let dataToSend: any = body;
    const hasImages = this.plantImages.length > 0;

    if (hasImages) {
      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((item, index) => {
            if (typeof item === 'object') {
              // Convert nested objects to string in FormData if needed, but best is JSON.stringify for complex
              formData.append(`${k}[${index}]`, JSON.stringify(item));
            } else {
              formData.append(k, item as any);
            }
          });
        } else if (typeof v === 'object' && v !== null) {
          formData.append(k, JSON.stringify(v));
        } else {
          formData.append(k, v as any);
        }
      });
      this.plantImages.forEach(file => formData.append('images', file));
      dataToSend = formData;
    }

    if (isUpdate && this.selectedPlantId) {
      this.dashboardService.updatePlantAdmin(this.selectedPlantId, dataToSend).subscribe({
        next: () => {
          this.alertService.success('تم تحديث النبات بنجاح ✅');
          this.resetPlantForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.alertService.error('حدث خطأ أثناء التحديث: ' + (err.error?.message || 'هذا الروت غير موجود أو هناك خطأ في البيانات'));
        }
      });
    } else {
      this.dashboardService.addPlantAdmin(dataToSend).subscribe({
        next: () => {
          this.alertService.success('تم إضافة النبات بنجاح ✅');
          this.resetPlantForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Add error:', err);
          this.alertService.error('حدث خطأ أثناء الإضافة: ' + (err.error?.message || ''));
        }
      });
    }
  }

  // ==================== EDIT HELPERS ====================
  private lastSelectedPlantId: string = '';

  onPlantSelect(id: string) {
    if (!id || id === 'undefined' || id === 'null') {
      this.resetPlantForm();
      return;
    }


    this.lastSelectedPlantId = id;

    this.wikiService.getPlantById(id).subscribe({
      next: (res: any) => {

        // ❗ تجاهل أي response قديم
        if (this.lastSelectedPlantId !== id) return;

        const p = res;

        if (!p) {
          this.alertService.error('بيانات النبات غير موجودة في السيرفر');
          return;
        }

        this.selectedPlantId = p._id || p.id;

        this.plantForm = {
          commonName: p.commonName || p.name || '',
          scientificName: p.scientificName || '',
          family: p.family || '',
          description: p.description || '',
          growingSeason: p.growingSeason || '',
          temperatureMin: p.temperatureRange?.min,
          temperatureMax: p.temperatureRange?.max,
          sunlightHours: p.sunlightHours,
          soilPHMin: p.soilPH?.min,
          soilPHMax: p.soilPH?.max,
          waterLevel: p.waterNeeds?.level || '',
          waterFrequency: p.waterNeeds?.frequency,
          nutritionalValue: p.nutritionalValue || '',
          potSizeOptions: p.potSizeOptions ? JSON.parse(JSON.stringify(p.potSizeOptions)) : [],
          growthStages: p.growthStages ? JSON.parse(JSON.stringify(p.growthStages)) : []
        };

        this.selectedDiseaseIds = (p.diseases || []).map((d: any) =>
          typeof d === 'string' ? d : (d._id || d.id)
        );

        this.selectedFertilizerIds = (p.fertilizers || []).map((f: any) =>
          typeof f === 'string' ? f : (f._id || f.id)
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching plant details:', err);
        this.alertService.error('حدث خطأ أثناء جلب بيانات النبات');
      }
    });
  }

  addPotSize() {
    this.plantForm.potSizeOptions.push({ plantType: '', min: 0, max: 0, unit: 'cm' });
  }
  removePotSize(index: number) { this.plantForm.potSizeOptions.splice(index, 1); }

  addGrowthStage() {
    this.plantForm.growthStages.push({ name: '', durationInDays: 0, description: '' });
  }
  removeGrowthStage(index: number) { this.plantForm.growthStages.splice(index, 1); }

  private resetPlantForm() {
    this.plantForm = {
      commonName: '', scientificName: '', family: '', description: '', growingSeason: '',
      temperatureMin: null, temperatureMax: null, sunlightHours: null, soilPHMin: null, soilPHMax: null,
      waterLevel: '', waterFrequency: null, nutritionalValue: '',
      potSizeOptions: [],
      growthStages: []
    };
    this.plantImages = [];
    this.selectedDiseaseIds = [];
    this.selectedFertilizerIds = [];
    this.selectedPlantId = '';
  }

  // ==================== SUBMIT DISEASE ====================
  submitDisease(isUpdate: boolean = false) {
    if (!this.diseaseForm.name?.trim() || !this.diseaseForm.pathogenType?.trim()) {
      this.alertService.warning('الرجاء ملء الحقول الأساسية: اسم المرض ونوع الممرض');
      return;
    }

    const body: any = {
      name: this.diseaseForm.name,
    };
    if (this.diseaseForm.scientificName) body.scientificName = this.diseaseForm.scientificName;
    if (this.diseaseForm.pathogenType) body.pathogenType = this.diseaseForm.pathogenType;
    if (this.diseaseForm.favorableConditions) body.favorableConditions = this.diseaseForm.favorableConditions;

    const symptoms = this.lines(this.diseaseForm.symptomsText);
    if (symptoms.length > 0) body.symptoms = symptoms;

    const prevention = this.lines(this.diseaseForm.preventionText);
    if (prevention.length > 0) body.prevention = prevention;

    const treatment = this.lines(this.diseaseForm.treatmentText);
    if (treatment.length > 0) body.treatment = treatment;

    // DETERMINING DATA TO SEND
    let dataToSend: any = body;
    const hasImage = !!this.diseaseImage;

    if (hasImage) {
      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (Array.isArray(v)) (v as string[]).forEach(item => formData.append(k, item));
        else formData.append(k, v as any);
      });
      formData.append('image', this.diseaseImage!);
      dataToSend = formData;
    }

    if (isUpdate && this.selectedDiseaseId) {
      this.dashboardService.updateDiseaseAdmin(this.selectedDiseaseId, dataToSend).subscribe({
        next: () => {
          this.alertService.success('تم تحديث المرض بنجاح ✅');
          this.resetDiseaseForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.alertService.error('حدث خطأ أثناء التحديث: ' + (err.error?.message || ''));
        }
      });
    } else {
      this.dashboardService.addDiseaseAdmin(dataToSend).subscribe({
        next: () => {
          this.alertService.success('تم إضافة المرض بنجاح ✅');
          this.resetDiseaseForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Add error:', err);
          this.alertService.error('حدث خطأ أثناء الإضافة: ' + (err.error?.message || ''));
        }
      });
    }
  }

  onDiseaseSelect(id: string) {
    if (!id || id === 'undefined') {
      this.resetDiseaseForm();
      return;
    }

    this.wikiService.getDiseaseById(id).subscribe({
      next: (res: any) => {
        const d = res;
        if (!d) return;

        this.selectedDiseaseId = d._id || d.id;
        this.diseaseForm = {
          name: d.name || '',
          scientificName: d.scientificName || '',
          pathogenType: d.pathogenType || '',
          favorableConditions: d.favorableConditions || '',
          symptomsText: (d.symptoms || []).join('\n'),
          preventionText: (d.prevention || []).join('\n'),
          treatmentText: (d.treatment || []).join('\n')
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching disease:', err);
        this.alertService.error('حدث خطأ أثناء جلب بيانات المرض');
      }
    });
  }

  private resetDiseaseForm() {
    this.diseaseForm = { name: '', scientificName: '', pathogenType: '', favorableConditions: '', symptomsText: '', preventionText: '', treatmentText: '' };
    this.diseaseImage = null;
    this.selectedDiseaseId = '';
  }

  // ==================== SUBMIT FERTILIZER ====================
  submitFertilizer(isUpdate: boolean = false) {
    if (!this.fertilizerForm.name?.trim() || !this.fertilizerForm.type?.trim()) {
      this.alertService.warning('الرجاء ملء الحقول الأساسية: اسم السماد ونوعه');
      return;
    }
    const body: any = { name: this.fertilizerForm.name };
    if (this.fertilizerForm.type) body.type = this.fertilizerForm.type;
    if (this.fertilizerForm.applicationMethod) body.applicationMethod = this.fertilizerForm.applicationMethod;
    if (this.fertilizerForm.applicationRate) body.applicationRate = this.fertilizerForm.applicationRate;

    const benefits = this.lines(this.fertilizerForm.benefitsText);
    if (benefits.length > 0) body.benefits = benefits;

    // parse composition: "عنصر:نسبة" per line
    const composition = this.lines(this.fertilizerForm.compositionText)
      .map(line => {
        const parts = line.split(':');
        return { element: parts[0]?.trim(), percentage: parseFloat(parts[1]) || 0 };
      }).filter(c => c.element);
    if (composition.length > 0) body.composition = composition;

    // DETERMINING DATA TO SEND
    let dataToSend: any = body;
    const hasImage = !!this.fertilizerImage;

    if (hasImage) {
      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          (v as any[]).forEach((item, i) => {
            if (typeof item === 'object') {
              Object.entries(item).forEach(([sk, sv]) => formData.append(`${k}[${i}][${sk}]`, sv as any));
            } else {
              formData.append(k, item);
            }
          });
        } else {
          formData.append(k, v as any);
        }
      });
      formData.append('image', this.fertilizerImage!);
      dataToSend = formData;
    }

    if (isUpdate && this.selectedFertilizerId) {
      this.dashboardService.updateFertilizerAdmin(this.selectedFertilizerId, dataToSend).subscribe({
        next: () => {
          this.alertService.success('تم تحديث السماد بنجاح ✅');
          this.resetFertilizerForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.alertService.error('حدث خطأ أثناء التحديث: ' + (err.error?.message || ''));
        }
      });
    } else {
      this.dashboardService.addFertilizerAdmin(dataToSend).subscribe({
        next: () => {
          this.alertService.success('تم إضافة السماد بنجاح ✅');
          this.resetFertilizerForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Add error:', err);
          this.alertService.error('حدث خطأ أثناء الإضافة: ' + (err.error?.message || ''));
        }
      });
    }
  }

  onFertilizerSelect(id: string) {
    if (!id || id === 'undefined') {
      this.resetFertilizerForm();
      return;
    }

    this.wikiService.getFertilizerById(id).subscribe({
      next: (res: any) => {
        const f = res;
        if (!f) return;

        this.selectedFertilizerId = f._id || f.id;
        this.fertilizerForm = {
          name: f.name || '',
          type: f.type || '',
          applicationMethod: f.applicationMethod || '',
          applicationRate: f.applicationRate || '',
          benefitsText: (f.benefits || []).join('\n'),
          compositionText: (f.composition || []).map((c: any) => `${c.element}:${c.percentage}`).join('\n')
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching fertilizer:', err);
        this.alertService.error('حدث خطأ أثناء جلب بيانات السماد');
      }
    });
  }

  private resetFertilizerForm() {
    this.fertilizerForm = { name: '', type: '', applicationMethod: '', applicationRate: '', benefitsText: '', compositionText: '' };
    this.fertilizerImage = null;
    this.selectedFertilizerId = '';
  }

  // ==================== SUBMIT PRODUCT ====================
  submitProduct(isUpdate: boolean = false) {
    if (!this.productForm.name?.trim() || !this.productForm.price || !this.productForm.stock === undefined || !this.productForm.category) {
      this.alertService.warning('الرجاء ملء الحقول الأساسية: الاسم، السعر، الكمية، والتصنيف');
      return;
    }
    const formData = new FormData();
    formData.append('name', this.productForm.name);
    formData.append('price', this.productForm.price.toString());
    formData.append('costPrice', this.productForm.costPrice.toString());
    formData.append('stock', this.productForm.stock.toString());
    if (this.productForm.description) formData.append('description', this.productForm.description);
    if (this.productForm.category) formData.append('category', this.productForm.category);
    if (this.productForm.discountPercent) formData.append('discountPercent', this.productForm.discountPercent.toString());
    this.productImages.forEach(file => formData.append('images', file));

    if (isUpdate && this.selectedProductId) {
      this.dashboardService.updateProductAdmin(this.selectedProductId, formData).subscribe({
        next: () => {
          this.alertService.success('تم تحديث المنتج بنجاح ✅');
          this.resetProductForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.alertService.error('حدث خطأ أثناء التحديث: ' + (err.error?.message || ''));
        }
      });
    } else {
      this.dashboardService.addProductAdmin(formData).subscribe({
        next: () => {
          this.alertService.success('تم إضافة المنتج بنجاح ✅');
          this.resetProductForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Add error:', err);
          this.alertService.error('حدث خطأ أثناء الإضافة: ' + (err.error?.message || ''));
        }
      });
    }
  }

  onProductSelect(id: string) {
    if (!id || id === 'undefined') {
      this.resetProductForm();
      return;
    }

    this.http.get<any>(`${this.base}/product/${id}`).subscribe({
      next: (res) => {
        const p = res.data;
        if (!p) return;

        this.selectedProductId = p._id || p.id;
        this.productForm = {
          name: p.name || '',
          description: p.description || '',
          category: (p.category?._id || p.category) || '',
          price: p.price || 0,
          costPrice: p.costPrice || 0,
          discountPercent: p.discountPercent || 0,
          stock: p.stock || 0
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching product details:', err);
        this.alertService.error('حدث خطأ أثناء جلب بيانات المنتج');
      }
    });
  }

  private resetProductForm() {
    this.productForm = { name: '', description: '', category: '', price: 0, costPrice: 0, discountPercent: 0, stock: 0 };
    this.productImages = [];
    this.selectedProductId = '';
  }

  // ==================== SUBMIT CATEGORY ====================
  submitCategory() {
    this.dashboardService.addCategoryAdmin(this.categoryForm).subscribe({
      next: () => { this.alertService.success('تم إضافة التصنيف بنجاح ✅'); this.categoryForm = { name: '', slug: '', description: '' }; this.setView('stats'); },
      error: (err) => { console.error(err); this.alertService.error('حدث خطأ: ' + (err.error?.message || '')); }
    });
  }

  // ==================== FORUM MODERATION ====================
  loadPendingPosts() {
    this.loadingPending = true;
    this.communityService.getPendingPosts().subscribe({
      next: (res: any) => {
        this.pendingPosts = res?.data?.posts || res || [];
        this.loadingPending = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading pending posts:', err);
        this.loadingPending = false;
      }
    });
  }

  approveForumPost(id: string) {
    this.openConfirmDialog(
      'تأكيد الموافقة',
      'هل أنت متأكد من الموافقة على نشر هذا البوست للعامة؟ لن يمكن التراجع بسهولة.',
      '✅ نعم، أوافق',
      'btn-success',
      () => {
        this.communityService.approvePost(id).subscribe({
          next: () => {
            this.alertService.success('تمت الموافقة على البوست بنجاح ✅');
            this.loadPendingPosts();
            this.loadAllData();
          },
          error: (err) => {
            this.alertService.error('حدث خطأ أثناء الموافقة');
            console.error(err);
          }
        });
      }
    );
  }

  rejectForumPost(id: string) {
    this.openConfirmDialog(
      'تأكيد الرفض والحذف',
      'هل أنت متأكد من رفض هذا البوست ومسحه نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.',
      '🗑️ نعم، إرفض البوست',
      'btn-danger',
      () => {
        this.communityService.rejectPost(id).subscribe({
          next: () => {
            this.alertService.success('تم رفض البوست بنجاح 🗑️');
            this.loadPendingPosts();
            this.loadAllData();
          },
          error: (err) => {
            this.alertService.error('حدث خطأ أثناء الرفض');
            console.error(err);
          }
        });
      }
    );
  }

  getAuthorName(author: any): string {
    if (!author) return 'مجهول';
    return (
      author.name ??
      author.username ??
      (`${author.firstName ?? ''} ${author.lastName ?? ''}`.trim())
    ) || 'مجهول';
  }
}
