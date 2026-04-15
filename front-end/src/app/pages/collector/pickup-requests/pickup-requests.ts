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
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  pickupList = signal<PickupRequest[]>([]);
  activeFilter = signal<Filter>('ALL');
  updatingId = signal<string | null>(null);

  // ── Accept confirm dialog ──────────────────────────────
  // Now just holds the pickup being confirmed — no amount needed at accept time
  confirmingPickup = signal<PickupRequest | null>(null);

  // ── Payment / weigh dialog ─────────────────────────────
  payingPickup = signal<PickupRequest | null>(null);
  weightInput = signal<number | null>(null);
  calculatedAmt = signal<number | null>(null);

  // ── Area / route filter ────────────────────────────────
  areaSearch = signal('');
  selectedArea = signal('');

  readonly availableAreas = computed(() => {
    const areas = new Set<string>();
    this.pickupList().forEach(p => {
      const area = (p as any).area ?? p.address?.split(',')[0].trim() ?? '';
      if (area) areas.add(area);
    });
    return Array.from(areas).sort();
  });

  readonly filteredAreas = computed(() => {
    const q = this.areaSearch().toLowerCase();
    return q
      ? this.availableAreas().filter(a => a.toLowerCase().includes(q))
      : this.availableAreas();
  });

  readonly filters: { value: Filter; label: string; count: () => number }[] = [
    { value: 'ALL', label: 'All', count: () => this.pickupList().length },
    { value: 'PENDING', label: 'Pending', count: () => this.pickupList().filter(p => p.status === 'PENDING').length },
    { value: 'ASSIGNED', label: 'My Jobs', count: () => this.pickupList().filter(p => p.status === 'ASSIGNED').length },
    { value: 'COMPLETED', label: 'Completed', count: () => this.pickupList().filter(p => p.status === 'COMPLETED').length },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const area = this.selectedArea();
    let list = [...this.pickupList()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (f !== 'ALL') list = list.filter(p => p.status === f);

    if (area) {
      list = list.filter(p => {
        const pickupArea = (p as any).area ?? p.address?.split(',')[0].trim() ?? '';
        return pickupArea.toLowerCase().includes(area.toLowerCase());
      });
    }
    return list;
  });

  ngOnInit(): void {
    this.pickupService.getAllPickups().subscribe({
      next: data => { this.pickupList.set(data); this.loading.set(false); this.checkHighlight(); },
      error: () => this.loading.set(false)
    });
  }

  private checkHighlight(): void {
    const id = this.route.snapshot.queryParamMap.get('highlight');
    if (id) {
      setTimeout(() => {
        document.getElementById('pickup-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  // ── Accept job — no amount at this stage ───────────────
  accept(pickup: PickupRequest): void {
    this.confirmingPickup.set(pickup);
  }

  confirmAccept(): void {
    const pickup = this.confirmingPickup();
    if (!pickup) return;

    this.updatingId.set(pickup.id);
    this.confirmingPickup.set(null);

    // Status ASSIGNED — no amount yet; amount is derived from weight at completion
    this.pickupService.updateStatus(pickup.id, 'ASSIGNED').subscribe({
      next: updated => {
        this.pickupList.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.updatingId.set(null);
        this.toast.success('Job accepted! You are now assigned to this pickup.');
      },
      error: () => {
        this.updatingId.set(null);
        this.toast.error('Failed to accept job. Please try again.');
      }
    });
  }

  cancelConfirm(): void { this.confirmingPickup.set(null); }

  // ── Weigh & payment dialog ─────────────────────────────
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
        // Handle comma-joined waste types — price from first type
        const primaryType = (pickup.wasteType as string).split(',')[0].trim() as WasteType;
        const rate = WASTE_PRICES_PER_KG[primaryType] ?? 5;
        this.calculatedAmt.set(Math.round(val * rate));
      }
    } else {
      this.weightInput.set(null);
      this.calculatedAmt.set(null);
    }
  }

  pricePerKgForPickup(pickup: PickupRequest): number {
    const primaryType = (pickup.wasteType as string).split(',')[0].trim() as WasteType;
    return WASTE_PRICES_PER_KG[primaryType] ?? 5;
  }

  confirmPayment(): void {
    const pickup = this.payingPickup();
    const amt = this.calculatedAmt();
    const weight = this.weightInput();
    if (!pickup || !amt || !weight) return;

    this.updatingId.set(pickup.id);
    this.closePaymentDialog();

    // Pass both amount and weightKg — backend recalculates from weight using system prices
    this.pickupService.updateStatus(pickup.id, 'COMPLETED', amt, weight).subscribe({
      next: updated => {
        this.pickupList.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.updatingId.set(null);
        this.toast.success(`Weight recorded (${weight} kg). Awaiting payment.`);
      },
      error: () => {
        this.updatingId.set(null);
        this.toast.error('Failed to complete job. Please try again.');
      }
    });
  }

  wasteIcon(t: string): string {
    const primary = (t ?? '').split(',')[0].trim();
    return ({ general: '🗑️', recyclable: '♻️', organic: '🌿', electronic: '💻', hazardous: '⚠️' } as any)[primary] ?? '📦';
  }
}