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

  selectedItem = signal<any>(null);

  ngOnInit() {
    this.fetchAllData();
  }

  fetchAllData() {
    this.wikiService.getPlants().subscribe(data => this.plants.set(data));
    this.wikiService.getDiseases().subscribe(data => this.diseases.set(data));
    this.wikiService.getFertilizers().subscribe(data => this.fertilizers.set(data));
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
  }

  openModal(item: any) {
    this.selectedItem.set(item);
  }

  closeModal() {
    this.selectedItem.set(null);
  }

  isPlant(item: any): item is Plant {
    return item && 'wateringSchedule' in item;
  }

  isDisease(item: any): item is Disease {
    return item && 'symptoms' in item;
  }

  isFertilizer(item: any): item is Fertilizer {
    return item && 'usageInstructions' in item;
  }
}

