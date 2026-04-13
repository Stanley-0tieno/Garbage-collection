export type UserRole = 'household' | 'collector' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  points?: number;
  token?: string;
  // Household specific
  nationalId?: string;
  // Collector specific
  businessRegNumber?: string;
  vehicleNumberPlate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  // Household specific
  nationalId?: string;
  // Collector specific
  businessRegNumber?: string;
  vehicleNumberPlate?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}