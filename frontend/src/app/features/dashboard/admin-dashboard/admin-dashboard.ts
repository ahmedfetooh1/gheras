import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';

  activeView: string = 'stats';

  // -------------------- lists for linking --------------------
  allDiseases: any[] = [];
  allFertilizers: any[] = [];
  allCategories: any[] = [];
  selectedDiseaseIds: string[] = [];
  selectedFertilizerIds: string[] = [];

  // -------------------- PLANT FORM --------------------
  plantForm: any = {
    commonName: '', scientificName: '', family: '', description: '',
    growingSeason: '', temperatureMin: null, temperatureMax: null,
    sunlightHours: null, soilPHMin: null, soilPHMax: null,
    waterLevel: '', waterFrequency: null, nutritionalValue: ''
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
  ngOnInit() {
    this.http.get<any>(`${this.base}/diseases`).subscribe({
      next: (res) => { this.allDiseases = res.data?.diseases || res.data || res || []; },
      error: () => {}
    });
    this.http.get<any>(`${this.base}/fertilizers`).subscribe({
      next: (res) => { this.allFertilizers = res.data?.fertilizers || res.data || res || []; },
      error: () => {}
    });
    this.http.get<any>(`${this.base}/category`).subscribe({
      next: (res) => { this.allCategories = res.data || res || []; },
      error: () => {}
    });
  }

  setView(view: string) { this.activeView = view; }

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
  submitPlant() {
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
    if (this.selectedDiseaseIds.length > 0) body.diseases = this.selectedDiseaseIds;
    if (this.selectedFertilizerIds.length > 0) body.fertilizers = this.selectedFertilizerIds;

    // If images → use FormData, else JSON
    if (this.plantImages.length > 0) {
      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          (v as any[]).forEach(item => formData.append(k, item));
        } else if (typeof v === 'object' && v !== null) {
          Object.entries(v as any).forEach(([sk, sv]) => formData.append(`${k}[${sk}]`, sv as any));
        } else {
          formData.append(k, v as any);
        }
      });
      this.plantImages.forEach(file => formData.append('images', file));
      this.dashboardService.addPlantAdmin(formData).subscribe({
        next: () => { alert('تم إضافة النبات بنجاح ✅'); this.resetPlantForm(); this.setView('stats'); },
        error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
      });
    } else {
      this.http.post(`${this.base}/plants`, body).subscribe({
        next: () => { alert('تم إضافة النبات بنجاح ✅'); this.resetPlantForm(); this.setView('stats'); },
        error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
      });
    }
  }

  private resetPlantForm() {
    this.plantForm = { commonName: '', scientificName: '', family: '', description: '', growingSeason: '', temperatureMin: null, temperatureMax: null, sunlightHours: null, soilPHMin: null, soilPHMax: null, waterLevel: '', waterFrequency: null, nutritionalValue: '' };
    this.plantImages = [];
    this.selectedDiseaseIds = [];
    this.selectedFertilizerIds = [];
  }

  // ==================== SUBMIT DISEASE ====================
  submitDisease() {
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

    if (this.diseaseImage) {
      const formData = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (Array.isArray(v)) (v as string[]).forEach(item => formData.append(k, item));
        else formData.append(k, v as any);
      });
      formData.append('image', this.diseaseImage);
      this.dashboardService.addDiseaseAdmin(formData).subscribe({
        next: () => { alert('تم إضافة المرض بنجاح ✅'); this.resetDiseaseForm(); this.setView('stats'); },
        error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
      });
    } else {
      this.http.post(`${this.base}/diseases`, body).subscribe({
        next: () => { alert('تم إضافة المرض بنجاح ✅'); this.resetDiseaseForm(); this.setView('stats'); },
        error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
      });
    }
  }

  private resetDiseaseForm() {
    this.diseaseForm = { name: '', scientificName: '', pathogenType: '', favorableConditions: '', symptomsText: '', preventionText: '', treatmentText: '' };
    this.diseaseImage = null;
  }

  // ==================== SUBMIT FERTILIZER ====================
  submitFertilizer() {
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

    if (this.fertilizerImage) {
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
      formData.append('image', this.fertilizerImage);
      this.dashboardService.addFertilizerAdmin(formData).subscribe({
        next: () => { alert('تم إضافة السماد بنجاح ✅'); this.resetFertilizerForm(); this.setView('stats'); },
        error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
      });
    } else {
      this.http.post(`${this.base}/fertilizers`, body).subscribe({
        next: () => { alert('تم إضافة السماد بنجاح ✅'); this.resetFertilizerForm(); this.setView('stats'); },
        error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
      });
    }
  }

  private resetFertilizerForm() {
    this.fertilizerForm = { name: '', type: '', applicationMethod: '', applicationRate: '', benefitsText: '', compositionText: '' };
    this.fertilizerImage = null;
  }

  // ==================== SUBMIT PRODUCT ====================
  submitProduct() {
    const formData = new FormData();
    formData.append('name', this.productForm.name);
    formData.append('price', this.productForm.price.toString());
    formData.append('costPrice', this.productForm.costPrice.toString());
    formData.append('stock', this.productForm.stock.toString());
    if (this.productForm.description) formData.append('description', this.productForm.description);
    if (this.productForm.category) formData.append('category', this.productForm.category);
    if (this.productForm.discountPercent) formData.append('discountPercent', this.productForm.discountPercent.toString());
    this.productImages.forEach(file => formData.append('images', file));
    this.dashboardService.addProductAdmin(formData).subscribe({
      next: () => { alert('تم إضافة المنتج بنجاح ✅'); this.productForm = { name: '', description: '', category: '', price: 0, costPrice: 0, discountPercent: 0, stock: 0 }; this.productImages = []; this.setView('stats'); },
      error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
    });
  }

  // ==================== SUBMIT CATEGORY ====================
  submitCategory() {
    this.dashboardService.addCategoryAdmin(this.categoryForm).subscribe({
      next: () => { alert('تم إضافة التصنيف بنجاح ✅'); this.categoryForm = { name: '', slug: '', description: '' }; this.setView('stats'); },
      error: (err) => { console.error(err); alert('حدث خطأ: ' + (err.error?.message || '')); }
    });
  }
}
