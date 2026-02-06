import express, { Request, Response, Router } from 'express';
import Room from '../../shared/models/Room';
import Booking from '../../shared/models/Booking';
import { RoomCache } from '../../shared/utils/redis';
import { RoomFilterQuery, RoomAvailabilityQuery } from '../../shared/types';

const router: Router = express.Router();

// GET /api/rooms - Get all rooms with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { building, type, floor, startTime, endTime } = req.query as Partial<RoomFilterQuery & { floor: string }>;

    // Build query object for basic filters
    const query: any = {};
    if (building) query.building = building;
    if (type) query.type = type;
    if (floor) query.floor = parseInt(floor);

    // Get rooms matching basic filters
    let rooms = await Room.find(query).sort({ building: 1, floor: 1, _id: 1 });

    // Get current and next booking information for all rooms
    const now = new Date();
    const roomsWithBookings = await Promise.all(
      rooms.map(async (room) => {
        const roomObj = room.toObject();

        // Find current booking (ongoing right now)
        const currentBooking = await Booking.findOne({
          roomId: room._id,
          status: 'CONFIRMED',
          startTime: { $lte: now },
          endTime: { $gt: now }
        }).select('startTime endTime userId');

        // Find next booking (upcoming)
        const nextBooking = await Booking.findOne({
          roomId: room._id,
          status: 'CONFIRMED',
          startTime: { $gt: now }
        }).sort({ startTime: 1 }).select('startTime endTime userId');

        return {
          ...roomObj,
          currentBooking: currentBooking || undefined,
          nextBooking: nextBooking || undefined
        };
      })
    );

    // If time range is specified, filter by availability
    let filteredRooms = roomsWithBookings;
    if (startTime && endTime) {
      const timeSlot = `${startTime}_${endTime}`;

      // Check availability for each room using Redis cache
      const availabilityChecks = await Promise.all(
        roomsWithBookings.map(async (room) => {
          const status = await RoomCache.getRoomStatus(room._id, timeSlot);
          return {
            room,
            available: status === 'AVAILABLE'
          };
        })
      );

      // Filter to only include available rooms
      filteredRooms = availabilityChecks
        .filter(check => check.available)
        .map(check => check.room);
    }

    res.json({
      success: true,
      count: filteredRooms.length,
      rooms: filteredRooms
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/rooms/buildings/list - Get list of buildings
router.get('/buildings/list', async (req: Request, res: Response) => {
  try {
    const buildings = await Room.distinct('building');

    res.json({
      success: true,
      buildings
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/rooms/:id - Get single room by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    return res.json({
      success: true,
      room
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/rooms/:id/availability - Check room availability for a time slot
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.query as Partial<RoomAvailabilityQuery>;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'startTime and endTime are required'
      });
    }

    const roomId = req.params.id;
    const timeSlot = `${startTime}_${endTime}`;

    // Check Redis for real-time availability
    const status = await RoomCache.getRoomStatus(roomId, timeSlot);

    return res.json({
      success: true,
      roomId,
      timeSlot: { startTime, endTime },
      status,
      available: status === 'AVAILABLE'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router;
