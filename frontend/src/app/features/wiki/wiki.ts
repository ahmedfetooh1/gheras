import { Component, signal, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WikiService, WikiResponse } from '../../core/services/wiki.service';

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wiki.html',
  styleUrl: './wiki.css',
})
export class Wiki implements OnInit {
  private wikiService = inject(WikiService);

  // Raw data from API
  plants = signal<any[]>([]);
  diseases = signal<any[]>([]);
  fertilizers = signal<any[]>([]);

  loading = signal<boolean>(true);
  searchQuery = '';
  activeFilter = signal<string>('all'); // all, plants, diseases, fertilizers
  subActiveFilter = signal<string>('all');
  selectedPlant = signal<any | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = 1;
  totalItems = 0;

  categories = [
    { label: 'الكل', value: 'all' },
    { label: 'نباتات', value: 'plants' },
    { label: 'أمراض', value: 'diseases' },
    { label: 'أسمدة', value: 'fertilizers' }
  ];

  subCategories = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return [];
    if (filter === 'plants') {
      const families = ['all', ...new Set(this.plants().map(p => p.family).filter(Boolean))];
      return families;
    }
    if (filter === 'fertilizers') {
      const types = ['all', ...new Set(this.fertilizers().map(f => f.type).filter(Boolean))];
      return types;
    }
    return [];
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const filter = this.activeFilter();
    const page = this.currentPage();

    // Reset lists
    if (filter === 'all' || filter === 'plants') {
      this.wikiService.getPlants(page, filter === 'all' ? 5 : 20).subscribe(res => {
        this.plants.set(res.data.plants || []);
        if (filter === 'plants') {
          this.totalPages = res.totalPages;
          this.totalItems = res.total;
        }
        this.finalizeLoading(filter);
      });
    }

    if (filter === 'all' || filter === 'diseases') {
      this.wikiService.getDiseases(page, filter === 'all' ? 5 : 20).subscribe(res => {
        this.diseases.set(res.data.diseases || []);
        if (filter === 'diseases') {
          this.totalPages = res.totalPages;
          this.totalItems = res.total;
        }
        this.finalizeLoading(filter);
      });
    }

    if (filter === 'all' || filter === 'fertilizers') {
      this.wikiService.getFertilizers(page, filter === 'all' ? 5 : 20).subscribe(res => {
        this.fertilizers.set(res.data.fertilizers || []);
        if (filter === 'fertilizers') {
          this.totalPages = res.totalPages;
          this.totalItems = res.total;
        }
        this.finalizeLoading(filter);
      });
    }
  }

  private finalizeLoading(filter: string) {
    if (filter === 'all') {
      this.totalPages = 1; 
    }
    this.loading.set(false);
  }

  get displayedItems() {
    let combined: any[] = [];
    const filter = this.activeFilter();
    const subFilter = this.subActiveFilter();

    const safeParse = (val: any) => {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch { return null; }
    };

    if (filter === 'all' || filter === 'plants') {
      let currentPlants = this.plants();
      if (filter === 'plants' && subFilter !== 'all') {
        currentPlants = currentPlants.filter(p => p.family === subFilter);
      }
      combined = [...combined, ...currentPlants.map(p => {
        const water = safeParse(p.waterNeeds);
        const temp = safeParse(p.temperatureRange);
        return {
          ...p,
          type: 'plant',
          displayName: p.commonName || 'نبتة جديدة',
          displaySub: p.scientificName || 'Phaseolus',
          displayImage: p.images?.[0],
          meta: {
              family: p.family || 'نبات',
              water: water?.level || 'متوسط',
              frequency: water?.frequency ? `كل ${water.frequency} أيام` : 'بانتظام',
              temp: temp ? `${temp.min || '-'}-${temp.max || '-'}°` : '-',
              sun: p.sunlightHours || '-'
          }
        };
      })];
    }

    if (filter === 'all' || filter === 'diseases') {
      combined = [...combined, ...this.diseases().map(d => ({
        ...d,
        type: 'disease',
        displayName: d.name || 'مرض',
        displaySub: d.scientificName || 'مرض نباتي',
        displayImage: d.image,
        meta: {
            family: 'مرض نباتي',
            water: 'علاجي',
            frequency: 'فوري',
        }
      }))];
    }

    if (filter === 'all' || filter === 'fertilizers') {
      let currentFert = this.fertilizers();
      if (filter === 'fertilizers' && subFilter !== 'all') {
        currentFert = currentFert.filter(f => f.type === subFilter);
      }
      combined = [...combined, ...currentFert.map(f => ({
        ...f,
        type: 'fertilizer',
        displayName: f.name || 'سماد',
        displaySub: f.type || 'سماد',
        displayImage: f.image,
        meta: {
            family: 'سماد عضوي',
            water: 'تغذية',
            frequency: 'موسمي',
        }
      }))];
    }

    // Client-side search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      combined = combined.filter(item => 
        item.displayName?.toLowerCase().includes(q) || 
        item.displaySub?.toLowerCase().includes(q)
      );
    }

    return combined;
  }

  setFilter(cat: string) {
    this.activeFilter.set(cat);
    this.subActiveFilter.set('all');
    this.currentPage.set(1);
    // Don't clear plants immediately if switching type, fetch logic will handle it
    this.loadData();
  }

  setSubFilter(sub: string) {
    this.subActiveFilter.set(sub);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage.set(page);
    this.loadData();
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  safeParse(val: any) {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return null; }
  }

  openModal(item: any) {
    if (item.type === 'plant') {
      this.wikiService.getPlantById(item._id).subscribe(res => {
        const p = res.data.plant;
        this.selectedPlant.set({ 
          ...p, 
          type: 'plant',
          name: p.commonName || 'نبتة جديدة',
          scientificName: p.scientificName || 'Phaseolus',
          waterData: this.safeParse(p.waterNeeds),
          tempData: this.safeParse(p.temperatureRange),
          phData: this.safeParse(p.soilPH)
        });
      });
    } else if (item.type === 'disease') {
      this.wikiService.getDiseaseById(item._id).subscribe(res => {
         const d = res.data.disease;
         this.selectedPlant.set({ 
           ...d, 
           type: 'disease',
           name: d.name || 'مرض',
           scientificName: d.scientificName || 'مرض نباتي'
         });
      });
    } else if (item.type === 'fertilizer') {
      this.wikiService.getFertilizerById(item._id).subscribe(res => {
        const f = res.data.fertilizer;
        this.selectedPlant.set({ 
          ...f, 
          type: 'fertilizer',
          name: f.name || 'سماد',
          scientificName: f.type || 'سماد عضوي'
        });
      });
    }
  }

  closeModal() {
    this.selectedPlant.set(null);
  }

  getImageUrl(path: string) {
    return this.wikiService.getImageUrl(path);
  }
}
