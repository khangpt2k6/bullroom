const express = require('express');
const router = express.Router();
const Room = require('../../shared/models/Room');
const { RoomCache } = require('../../shared/utils/redis');

// GET /api/rooms - Get all rooms with optional filters
router.get('/', async (req, res) => {
  try {
    const { building, type, floor } = req.query;

    // Build query object
    const query = {};
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/rooms/:id - Get single room by ID
router.get('/:id', async (req, res) => {
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/rooms/:id/availability - Check room availability for a time slot
router.get('/:id/availability', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/rooms/buildings/list - Get list of buildings
router.get('/buildings/list', async (req, res) => {
  try {
    const buildings = await Room.distinct('building');

    res.json({
      success: true,
      buildings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
