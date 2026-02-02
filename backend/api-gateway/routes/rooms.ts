import express, { Request, Response, Router } from 'express';
import Room from '../../shared/models/Room';
import { RoomCache } from '../../shared/utils/redis';
import { RoomFilterQuery, RoomAvailabilityQuery } from '../../shared/types';

const router: Router = express.Router();

// GET /api/rooms - Get all rooms with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { building, type, floor } = req.query as Partial<RoomFilterQuery & { floor: string }>;

    // Build query object
    const query: Partial<RoomFilterQuery> = {};
    if (building) query.building = building;
    if (type) query.type = type;
    if (floor) query.floor = parseInt(floor);

    const rooms = await Room.find(query).sort({ building: 1, floor: 1, _id: 1 });

    res.json({
      success: true,
      count: rooms.length,
      rooms
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

    res.json({
      success: true,
      room
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/rooms/:id/availability - Check room availability for a time slot
router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.query as RoomAvailabilityQuery;

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

    res.json({
      success: true,
      roomId,
      timeSlot: { startTime, endTime },
      status,
      available: status === 'AVAILABLE'
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

export default router;
