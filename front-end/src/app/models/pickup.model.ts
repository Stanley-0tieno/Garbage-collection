export type PickupStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type WasteType = 'general' | 'recyclable' | 'organic' | 'electronic' | 'hazardous';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED';

// Predefined system prices per kg per waste type (KES)
export const WASTE_PRICES_PER_KG: Record<WasteType, number> = {
  general:    5,
  recyclable: 12,
  organic:    8,
  electronic: 20,
  hazardous:  25,
};

export interface PickupRequest {
  id: string;
  userId: string;
  wasteType: WasteType;
  date?: string;         // Set by collector, not household
  area?: string;         // Area/zone for routing
  address: string;
  notes?: string;
  imageUrl?: string;
  weightKg?: number;     // Actual weight entered by collector after weighing
  status: PickupStatus;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  collectorId?: string;
  collectorName?: string;
  completedAt?: string;
  pointsEarned?: number;
  createdAt: string;
  amount?: number;       // Calculated from weightKg × predefined price
}

export interface CreatePickupRequest {
  wasteType: WasteType;
  address: string;
  area?: string;
  notes?: string;
  imageUrl?: string;
}

export interface PaymentRequest {
  pickupId: string;
  phone: string;
  amount: number;
}

export interface PaymentResponse {
  checkoutRequestId: string;
  message: string;
}