import { Component, signal, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WikiService } from '../../core/services/wiki.service';
import { Plant, Disease, Fertilizer } from '../../core/models/interfaces';

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wiki.html',
  styleUrl: './wiki.css',
  encapsulation: ViewEncapsulation.None
})
export class Wiki implements OnInit {
  private wikiService = inject(WikiService);
  private cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  activeTab = signal<'plants' | 'diseases' | 'fertilizers'>('plants');

  plants = signal<Plant[]>([]);
  diseases = signal<Disease[]>([]);
  fertilizers = signal<Fertilizer[]>([]);

  currentPage = signal(1);
  totalPages = signal(1);

  // Detail View State & History
  selectedItem = signal<any>(null);
  itemType = signal<'plant' | 'disease' | 'fertilizer' | null>(null);
  navigationHistory: any[] = [];

  ngOnInit() {
    this.goToPage(1);
  }

  goToPage(page: number) {
    if (page < 1 || (this.totalPages() > 0 && page > this.totalPages())) return;
    
    this.currentPage.set(page);
    
    if (this.activeTab() === 'plants') {
      this.wikiService.getPlants(page).subscribe(res => {
        this.plants.set(res.data?.plants || []);
        this.totalPages.set(res.totalPages || 1);
      });
    } else if (this.activeTab() === 'diseases') {
      this.wikiService.getDiseases(page).subscribe(res => {
        this.diseases.set(res.data?.diseases || []);
        this.totalPages.set(res.totalPages || 1);
      });
    } else {
      this.wikiService.getFertilizers(page).subscribe(res => {
        this.fertilizers.set(res.data?.fertilizers || []);
        this.totalPages.set(res.totalPages || 1);
      });
    }
  }

  get filteredPlants() {
    return this.plants().filter(p => p.commonName.toLowerCase().includes(this.searchQuery.toLowerCase()) || (p.scientificName?.toLowerCase().includes(this.searchQuery.toLowerCase())));
  }

  get filteredDiseases() {
    return this.diseases().filter(d => d.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  get filteredFertilizers() {
    return this.fertilizers().filter(f => f.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  setTab(tab: 'plants' | 'diseases' | 'fertilizers') {
    this.activeTab.set(tab);
    this.goToPage(1);
  }

  // Interconnected Linking Logic
  openItem(id: string, type: 'plant' | 'disease' | 'fertilizer', fromLink: boolean = false) {
    // If navigating from inside another item, save current to history
    if (fromLink && this.selectedItem()) {
      this.navigationHistory.push({
        item: this.selectedItem(),
        type: this.itemType()
      });
    } else if (!fromLink) {
      this.navigationHistory = []; // Reset history if we started from the main grid
    }

    this.itemType.set(type);
    
    if (type === 'plant') {
      this.wikiService.getPlantById(id).subscribe(res => this.selectedItem.set(res));
    } else if (type === 'disease') {
      this.wikiService.getDiseaseById(id).subscribe(res => this.selectedItem.set(res));
    } else if (type === 'fertilizer') {
      this.wikiService.getFertilizerById(id).subscribe(res => this.selectedItem.set(res));
    }
  }

  goBack() {
    if (this.navigationHistory.length > 0) {
      const last = this.navigationHistory.pop();
      this.selectedItem.set(last.item);
      this.itemType.set(last.type);
      this.cdr.detectChanges();
    }
  }

  closeModal() {
    this.selectedItem.set(null);
    this.itemType.set(null);
    this.navigationHistory = [];
  }

  // Logic to find plants related to a specific disease or fertilizer
  getRelatedPlants(itemId: string, type: 'disease' | 'fertilizer'): Plant[] {
    return this.plants().filter(p => {
      const field = type === 'disease' ? p.diseases : p.fertilizers;
      return field?.some(ref => {
        const refId = typeof ref === 'string' ? ref : (ref._id || ref.id);
        return refId === itemId;
      });
    });
  }

  getId(item: any): string {
    return item?._id || item?.id || '';
  }
}
