export type PickupStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type WasteType = 'general' | 'recyclable' | 'organic' | 'electronic' | 'hazardous';

export interface PickupRequest {
  id: string;
  userId: string;
  wasteType: WasteType;
  date: string;         // ISO date string
  address: string;
  notes?: string;
  status: PickupStatus;
  collectorId?: string;
  collectorName?: string;
  completedAt?: string;
  pointsEarned?: number;
  createdAt: string;
}

export interface CreatePickupRequest {
  wasteType: WasteType;
  date: string;
  address: string;
  notes?: string;
}