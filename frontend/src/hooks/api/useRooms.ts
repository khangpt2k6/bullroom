import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { roomsApi } from '../../services/api/rooms';
import {
  RoomsResponse,
  RoomResponse,
  RoomAvailabilityResponse,
  BuildingsResponse,
  RoomAvailabilityQuery,
} from '../../types/api';
import { RoomFilters } from '../../types/models';

// Get all rooms with optional filters
export const useRooms = (filters?: RoomFilters): UseQueryResult<RoomsResponse> => {
  return useQuery({
    queryKey: ['rooms', filters],
    queryFn: () => roomsApi.getRooms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single room by ID
export const useRoom = (roomId: string): UseQueryResult<RoomResponse> => {
  return useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => roomsApi.getRoom(roomId),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,
  });
};

// Check room availability
export const useRoomAvailability = (
  roomId: string,
  query: RoomAvailabilityQuery
): UseQueryResult<RoomAvailabilityResponse> => {
  return useQuery({
    queryKey: ['rooms', 'availability', roomId, query],
    queryFn: () => roomsApi.getRoomAvailability(roomId, query),
    enabled: !!roomId && !!query.startTime && !!query.endTime,
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent updates for availability)
  });
};

// Get list of buildings
export const useBuildings = (): UseQueryResult<BuildingsResponse> => {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => roomsApi.getBuildings(),
    staleTime: 60 * 60 * 1000, // 1 hour (buildings don't change often)
  });
};
