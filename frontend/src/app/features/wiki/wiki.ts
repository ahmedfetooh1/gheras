import { Component, signal, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
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
})
export class Wiki implements OnInit {
  private wikiService = inject(WikiService);

  searchQuery = '';
  activeTab = signal<'plants' | 'diseases' | 'fertilizers'>('plants');

  plants = signal<Plant[]>([]);
  diseases = signal<Disease[]>([]);
  fertilizers = signal<Fertilizer[]>([]);

  currentPage = signal(1);
  totalPages = signal(1);

  selectedItem = signal<any>(null);

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
    return this.plants().filter(p => p.commonName.includes(this.searchQuery) || (p.scientificName && p.scientificName.includes(this.searchQuery)));
  }

  get filteredDiseases() {
    return this.diseases().filter(d => d.name.includes(this.searchQuery) || d.symptoms.includes(this.searchQuery));
  }

  get filteredFertilizers() {
    return this.fertilizers().filter(f => f.name.includes(this.searchQuery) || f.type.includes(this.searchQuery));
  }

  setTab(tab: 'plants' | 'diseases' | 'fertilizers') {
    this.activeTab.set(tab);
    this.goToPage(1);
  }

  openModal(item: any) {
    this.selectedItem.set(item);
  }

  closeModal() {
    this.selectedItem.set(null);
  }

  isPlant(item: any): item is Plant {
    return item && 'commonName' in item;
  }

  isDisease(item: any): item is Disease {
    return item && 'symptoms' in item;
  }

  isFertilizer(item: any): item is Fertilizer {
    return item && 'usageInstructions' in item;
  }
}

