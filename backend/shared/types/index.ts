// Type definitions for BullRoom Backend

import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: Date;
}

// Room Types
export type RoomBuilding = 'Library' | 'MSC' | 'ENB';
export type RoomType = 'Individual' | 'Group' | 'Large Group';

export interface IRoom {
  _id: string; // Custom ID like "LIB-224"
  building: RoomBuilding;
  floor: number;
  type: RoomType;
  capacity: string;
  description: string;
  available: boolean;
  features: string[];
  createdAt: Date;
}

// Booking Types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId: string; // Changed from ObjectId to String to support Clerk user IDs
  roomId: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
}

// API Request/Response Types
export interface CreateBookingRequest {
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

export interface BookingQueueMessage {
  bookingId: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  timeSlot: string;
}

export interface RoomAvailabilityQuery {
  startTime: string;
  endTime: string;
}

export interface RoomFilterQuery {
  building?: RoomBuilding;
  type?: RoomType;
  floor?: number;
  startTime?: string; // ISO string for filtering by availability
  endTime?: string;   // ISO string for filtering by availability
}

export interface BookingFilterQuery {
  userId?: string;
  roomId?: string;
  status?: BookingStatus;
}

// Redis Room Update Event
export interface RoomUpdateEvent {
  roomId: string;
  timeSlot: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  userId?: string;
  timestamp?: string;
  bookingEndTime?: string; // ISO string of when the booking ends (for showing "Occupied until")
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface RoomsResponse {
  success: boolean;
  count: number;
  rooms: IRoom[];
}

export interface BookingsResponse {
  success: boolean;
  count: number;
  bookings: IBooking[];
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
