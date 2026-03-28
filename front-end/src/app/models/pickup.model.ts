export type PickupStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type WasteType = 'general' | 'recyclable' | 'organic' | 'electronic' | 'hazardous';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED';

export interface PickupRequest {
  id: string;
  userId: string;
  wasteType: WasteType;
  date: string;
  address: string;
  notes?: string;
  imageUrl?: string;
  weightEstimate?: number;
  status: PickupStatus;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  collectorId?: string;
  collectorName?: string;
  completedAt?: string;
  pointsEarned?: number;
  createdAt: string;
  amount?: number;
}

export interface CreatePickupRequest {
  wasteType: WasteType;
  date: string;
  address: string;
  notes?: string;
  imageUrl?: string;
  weightEstimate?: number;
  amount?: number;
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