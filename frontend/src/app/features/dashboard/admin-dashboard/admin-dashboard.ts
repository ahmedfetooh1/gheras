import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../../core/services/dashboard.service';
import { WikiService } from '../../../core/services/wiki.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private wikiService = inject(WikiService);
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';
  private cdr = inject(ChangeDetectorRef);

  activeView: string = 'stats';

  // -------------------- lists for linking --------------------
  allPlants: any[] = [];
  allDiseases: any[] = [];
  allFertilizers: any[] = [];
  allCategories: any[] = [];
  selectedDiseaseIds: string[] = [];
  selectedFertilizerIds: string[] = [];

  // ==================== EDIT PLANT ====================
  selectedPlantId: string = '';

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
  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.wikiService.getPlants(1, 1000).subscribe({
      next: (res) => {
        this.allPlants = res.data?.plants || [];
      },
      error: (err) => { console.error('Error fetching plants:', err); }
    });
    this.wikiService.getDiseases(1, 1000).subscribe({
      next: (res) => {
        this.allDiseases = res.data?.diseases || [];
      },
      error: (err) => { console.error('Error fetching diseases:', err); }
    });
    this.wikiService.getFertilizers(1, 1000).subscribe({
      next: (res) => {
        this.allFertilizers = res.data?.fertilizers || [];
      },
      error: (err) => { console.error('Error fetching fertilizers:', err); }
    });
    this.http.get<any>(`${this.base}/category`).subscribe({
      next: (res) => { this.allCategories = res.data || res || []; },
      error: () => { }
    });
  }

  setView(view: string) {
    this.activeView = view;
    this.resetPlantForm(); // ريست للفورم عند تغيير الواجهة عشان البيانات متتداخلش
    this.loadAllData();    // تأكد إن البيانات فريش دائماً
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
          alert('تم تحديث النبات بنجاح ✅');
          this.resetPlantForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('حدث خطأ أثناء التحديث: ' + (err.error?.message || 'هذا الروت غير موجود أو هناك خطأ في البيانات'));
        }
      });
    } else {
      this.dashboardService.addPlantAdmin(dataToSend).subscribe({
        next: () => {
          alert('تم إضافة النبات بنجاح ✅');
          this.resetPlantForm();
          this.setView('stats');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Add error:', err);
          alert('حدث خطأ أثناء الإضافة: ' + (err.error?.message || ''));
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

        const p = res.data?.plant || res.plant || res;

        if (!p) {
          alert('بيانات النبات غير موجودة في السيرفر');
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
        alert('حدث خطأ أثناء جلب بيانات النبات');
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
