import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PickupService } from '../../../services/api/pickup.service';
import { ToastService } from '../../../services/toast/toast.service';
import { PickupCardComponent } from '../../../components/pickup-card/pickup-card';
import { PickupRequest, PickupStatus, WasteType, WASTE_PRICES_PER_KG } from '../../../models/pickup.model';

type Filter = 'ALL' | PickupStatus;

@Component({
  selector: 'app-pickup-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PickupCardComponent],
  templateUrl: './pickup-requests.html',
  styleUrl: './pickup-requests.scss'
})
export class PickupRequests implements OnInit {
  private pickupService = inject(PickupService);
  private toast         = inject(ToastService);
  private route         = inject(ActivatedRoute);

  loading      = signal(true);
  pickupList   = signal<PickupRequest[]>([]);
  activeFilter = signal<Filter>('ALL');
  updatingId   = signal<string | null>(null);

  // ── Accept / quote dialog ──────────────────────────────
  confirmingId   = signal<string | null>(null);
  acceptAmount   = signal<number | null>(null);

  // ── Payment / weigh dialog ─────────────────────────────
  payingPickup   = signal<PickupRequest | null>(null);
  weightInput    = signal<number | null>(null);   // kg entered by collector
  calculatedAmt  = signal<number | null>(null);   // auto-calculated from weight × price

  // ── Area / route filter ────────────────────────────────
  areaSearch     = signal('');
  selectedArea   = signal('');

  /** Extract unique areas from all pickups (from address — first comma segment) */
  readonly availableAreas = computed(() => {
    const areas = new Set<string>();
    this.pickupList().forEach(p => {
      if (p.area) {
        areas.add(p.area);
      } else if (p.address) {
        // Fall back: extract first part of address as area
        const part = p.address.split(',')[0].trim();
        if (part) areas.add(part);
      }
    });
    return Array.from(areas).sort();
  });

  readonly filteredAreas = computed(() => {
    const q = this.areaSearch().toLowerCase();
    return q ? this.availableAreas().filter(a => a.toLowerCase().includes(q)) : this.availableAreas();
  });

  readonly filters: { value: Filter; label: string; count: () => number }[] = [
    { value: 'ALL',       label: 'All',       count: () => this.pickupList().length },
    { value: 'PENDING',   label: 'Pending',   count: () => this.pickupList().filter(p => p.status === 'PENDING').length },
    { value: 'ASSIGNED',  label: 'My Jobs',   count: () => this.pickupList().filter(p => p.status === 'ASSIGNED').length },
    { value: 'COMPLETED', label: 'Completed', count: () => this.pickupList().filter(p => p.status === 'COMPLETED').length },
  ];

  readonly filtered = computed(() => {
    const f    = this.activeFilter();
    const area = this.selectedArea();
    let list   = [...this.pickupList()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (f !== 'ALL') {
      list = list.filter(p => p.status === f);
    }

    if (area) {
      list = list.filter(p => {
        const pickupArea = p.area ?? p.address?.split(',')[0].trim() ?? '';
        return pickupArea.toLowerCase().includes(area.toLowerCase());
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.pickupService.getAllPickups().subscribe({
      next: data => { this.pickupList.set(data); this.loading.set(false); this.checkHighlight(); },
      error: ()  => this.loading.set(false)
    });
  }

  private checkHighlight(): void {
    const id = this.route.snapshot.queryParamMap.get('highlight');
    if (id) {
      setTimeout(() => {
        const el = document.getElementById('pickup-' + id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }

  setFilter(f: Filter) { this.activeFilter.set(f); }

  selectArea(area: string): void {
    this.selectedArea.set(this.selectedArea() === area ? '' : area);
    this.areaSearch.set('');
  }

  clearAreaFilter(): void {
    this.selectedArea.set('');
    this.areaSearch.set('');
  }

  // ── Accept / quote job ─────────────────────────────────
  accept(pickup: PickupRequest): void {
    this.confirmingId.set(pickup.id);
    this.acceptAmount.set(null);
  }

  updateAmount(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.acceptAmount.set(Number(el.value));
  }

  confirmAccept(): void {
    const id = this.confirmingId();
    if (!id || !this.acceptAmount()) return;
    this.updatingId.set(id);
    this.confirmingId.set(null);

    this.pickupService.updateStatus(id, 'ASSIGNED', this.acceptAmount()!).subscribe({
      next: updated => {
        this.pickupList.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.updatingId.set(null);
        this.toast.success('Job accepted! You have been assigned to this pickup.');
      },
      error: () => { this.updatingId.set(null); this.toast.error('Failed to accept job.'); }
    });
  }

  cancelConfirm(): void { this.confirmingId.set(null); }

  // ── Payment / weigh dialog ─────────────────────────────
  openPaymentDialog(pickup: PickupRequest): void {
    this.payingPickup.set(pickup);
    this.weightInput.set(null);
    this.calculatedAmt.set(null);
  }

  closePaymentDialog(): void {
    this.payingPickup.set(null);
    this.weightInput.set(null);
    this.calculatedAmt.set(null);
  }

  onWeightInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val > 0) {
      this.weightInput.set(val);
      const pickup = this.payingPickup();
      if (pickup) {
        // Use first waste type if multiple — in a real app you'd handle multi-type
        const wasteType = Array.isArray(pickup.wasteType)
          ? (pickup.wasteType as WasteType[])[0]
          : pickup.wasteType as WasteType;
        const rate = WASTE_PRICES_PER_KG[wasteType] ?? 5;
        this.calculatedAmt.set(Math.round(val * rate));
      }
    } else {
      this.weightInput.set(null);
      this.calculatedAmt.set(null);
    }
  }

  pricePerKgForPickup(pickup: PickupRequest): number {
    const wasteType = Array.isArray(pickup.wasteType)
      ? (pickup.wasteType as WasteType[])[0]
      : pickup.wasteType as WasteType;
    return WASTE_PRICES_PER_KG[wasteType] ?? 5;
  }

  confirmPayment(): void {
    const pickup = this.payingPickup();
    const amt    = this.calculatedAmt();
    const weight = this.weightInput();
    if (!pickup || !amt || !weight) return;

    this.updatingId.set(pickup.id);
    this.closePaymentDialog();

    this.pickupService.updateStatus(pickup.id, 'COMPLETED', amt).subscribe({
      next: updated => {
        this.pickupList.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.updatingId.set(null);
        this.toast.success(`Payment of KES ${amt} recorded for ${weight}kg. Job completed!`);
      },
      error: () => { this.updatingId.set(null); this.toast.error('Failed to complete job.'); }
    });
  }

  wasteIcon(t: string) {
    return ({ general:'🗑️', recyclable:'♻️', organic:'🌿', electronic:'💻', hazardous:'⚠️' } as any)[t] ?? '📦';
  }
}