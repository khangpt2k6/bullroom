import { Room, Booking } from './models';

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Room API responses
export interface RoomsResponse {
  success: boolean;
  count: number;
  rooms: Room[];
}

export interface RoomResponse {
  success: boolean;
  room: Room;
}

export interface RoomAvailabilityResponse {
  success: boolean;
  roomId: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  status: string;
  available: boolean;
}

export interface BuildingsResponse {
  success: boolean;
  buildings: string[];
}

// Booking API responses
export interface BookingsResponse {
  success: boolean;
  count: number;
  bookings: Booking[];
}

export interface BookingResponse {
  success: boolean;
  booking: Booking;
}

export interface CreateBookingResponse {
  success: boolean;
  booking: Booking;
  message: string;
}

// Request types
export interface CreateBookingRequest {
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

export interface RoomAvailabilityQuery {
  startTime: string;
  endTime: string;
}
