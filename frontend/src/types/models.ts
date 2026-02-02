// Core data models matching backend
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

export interface Room {
  _id: string; // e.g., "LIB-224"
  building: string;
  floor: number;
  type: 'Individual' | 'Group' | 'Large Group';
  capacity: string;
  description: string;
  available: boolean;
  features: string[];
  createdAt: string;
}

export interface Booking {
  _id: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

export interface RoomFilters {
  building?: string;
  type?: 'Individual' | 'Group' | 'Large Group';
  floor?: number;
  capacity?: string;
}

export interface BookingFilters {
  status?: ('PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED')[];
}
