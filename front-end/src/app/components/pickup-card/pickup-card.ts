import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../status-badge/status-badge';
import { PickupRequest } from '../../models/pickup.model';

@Component({
  selector: 'app-pickup-card',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './pickup-card.html',
  styleUrl: './pickup-card.scss'
})
export class PickupCardComponent {
  @Input() pickup!: PickupRequest;
  @Input() customerPhone?: string;
  @Input() loading = false;
  @Input() showActions = true;
  @Input() compact = false;

  @Output() accept    = new EventEmitter<PickupRequest>();
  @Output() complete  = new EventEmitter<PickupRequest>();
  @Output() viewImage = new EventEmitter<string>();

  imageModalOpen = signal(false);

  get wasteIcon(): string {
    return { general: '🗑️', recyclable: '♻️', organic: '🌿', electronic: '💻', hazardous: '⚠️' }
      [this.pickup.wasteType] ?? '📦';
  }

  get wasteLabel(): string {
    return { general: 'General Waste', recyclable: 'Recyclable', organic: 'Organic',
             electronic: 'Electronic', hazardous: 'Hazardous' }[this.pickup.wasteType] ?? this.pickup.wasteType;
  }

  get mapsUrl(): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.pickup.address)}`;
  }

  get directionsUrl(): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(this.pickup.address)}`;
  }

  openMaps(type: 'search' | 'directions'): void {
    window.open(type === 'directions' ? this.directionsUrl : this.mapsUrl, '_blank');
  }

  openImage(): void {
    if (this.pickup.imageUrl) {
      this.imageModalOpen.set(true);
      this.viewImage.emit(this.pickup.imageUrl);
    }
  }

  closeImage(): void { this.imageModalOpen.set(false); }
}