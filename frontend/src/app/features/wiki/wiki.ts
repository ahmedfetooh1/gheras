import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Plant {
  id: string;
  name: string;
  en: string;
  cat: string;
  habitat: string;
  water: string;
  temp: string;
  emoji: string;
  color: string;
}

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wiki.html',
  styleUrl: './wiki.css',
})
export class Wiki {
  searchQuery = '';
  activeFilter = signal<string>('all');
  selectedPlant = signal<Plant | null>(null);

  plants: Plant[] = [
    { id: 'tomato', name: 'الطماطم', en: 'Solanum lycopersicum', cat: 'خضروات', habitat: 'برة / جوه', water: 'كل يومين', temp: '15–35°', emoji: '🍅', color: 'linear-gradient(135deg,#fff5f5,#fee2e2)' },
    { id: 'cactus', name: 'الكاكتوس', en: 'Cactaceae', cat: 'صبار', habitat: 'داخلي / خارجي', water: 'كل 14 يوم', temp: '10–45°', emoji: '🌵', color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
    { id: 'rose', name: 'الورد الجوري', en: 'Rosa damascena', cat: 'زهور', habitat: 'خارجي', water: 'يومياً', temp: '15–28°', emoji: '🌹', color: 'linear-gradient(135deg,#fff1f2,#ffe4e6)' },
    { id: 'mint', name: 'النعناع', en: 'Mentha piperita', cat: 'أعشاب', habitat: 'داخلي / خارجي', water: 'يومياً', temp: '10–25°', emoji: '🌿', color: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)' },
    { id: 'strawberry', name: 'الفراولة', en: 'Fragaria × ananassa', cat: 'فواكه', habitat: 'خارجي', water: 'كل يومين', temp: '10–26°', emoji: '🍓', color: 'linear-gradient(135deg,#fff1f2,#fce7f3)' },
    { id: 'sunflower', name: 'دوار الشمس', en: 'Helianthus annuus', cat: 'زهور', habitat: 'خارجي', water: 'كل 3 أيام', temp: '18–35°', emoji: '🌻', color: 'linear-gradient(135deg,#fefce8,#fef08a)' },
    { id: 'broccoli', name: 'البروكلي', en: 'Brassica oleracea', cat: 'خضروات', habitat: 'خارجي', water: 'يومياً', temp: '7–24°', emoji: '🥦', color: 'linear-gradient(135deg,#f0fdf4,#86efac)' },
    { id: 'lemon', name: 'الليمون', en: 'Citrus limon', cat: 'أشجار', habitat: 'خارجي', water: 'مرتين/أسبوع', temp: '15–38°', emoji: '🍋', color: 'linear-gradient(135deg,#fefce8,#fde68a)' },
    { id: 'aloe', name: 'الألوفيرا', en: 'Aloe vera', cat: 'صبار', habitat: 'داخلي', water: 'كل 10 أيام', temp: '10–40°', emoji: '🪴', color: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
    { id: 'basil', name: 'الريحان', en: 'Ocimum basilicum', cat: 'أعشاب', habitat: 'داخلي', water: 'يومياً', temp: '15–30°', emoji: '🍃', color: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)' }
  ];

  categories = ['الكل', 'خضروات', 'زهور', 'فواكه', 'أعشاب', 'صبار', 'أشجار'];

  get filteredPlants() {
    return this.plants.filter(p => {
      const matchesSearch = p.name.includes(this.searchQuery) || p.en.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesFilter = this.activeFilter() === 'all' || this.activeFilter() === 'الكل' || p.cat === this.activeFilter();
      return matchesSearch && matchesFilter;
    });
  }

  setFilter(cat: string) {
    this.activeFilter.set(cat);
  }

  openModal(plant: Plant) {
    this.selectedPlant.set(plant);
  }

  closeModal() {
    this.selectedPlant.set(null);
  }
}
