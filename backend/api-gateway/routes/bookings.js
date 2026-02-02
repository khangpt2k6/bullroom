const express = require('express');
const router = express.Router();
const Booking = require('../../shared/models/Booking');
const Room = require('../../shared/models/Room');
const { publishBookingRequest } = require('../../shared/utils/rabbitmq');
const { RoomCache } = require('../../shared/utils/redis');

// POST /api/bookings - Create new booking request
router.post('/', async (req, res) => {
  try {
    const { userId, roomId, startTime, endTime } = req.body;

    // Validation
    if (!userId || !roomId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, roomId, startTime, endTime'
      });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Validate time
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book in the past'
      });
    }

    // Create pending booking in MongoDB
    const booking = new Booking({
      userId,
      roomId,
      startTime: start,
      endTime: end,
      status: 'PENDING'
    });

    await booking.save();

    // Publish to RabbitMQ for processing
    await publishBookingRequest({
      bookingId: booking._id.toString(),
      userId,
      roomId,
      startTime: startTime,
      endTime: endTime,
      timeSlot: `${startTime}_${endTime}`
    });

    res.status(202).json({
      success: true,
      message: 'Booking request received and is being processed',
      booking: {
        id: booking._id,
        status: 'PENDING',
        roomId,
        startTime,
        endTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/bookings - Get all bookings (with filters)
router.get('/', async (req, res) => {
  try {
    const { userId, roomId, status } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (roomId) query.roomId = roomId;
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('roomId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('roomId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bookings/:id/confirm - Confirm a held booking
router.post('/:id/confirm', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Cannot confirm booking with status: ${booking.status}`
      });
    }

    // Update to confirmed
    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date();
    await booking.save();

    // Update Redis
    const timeSlot = `${booking.startTime.toISOString()}_${booking.endTime.toISOString()}`;
    await RoomCache.confirmBooking(booking.roomId, timeSlot, booking.userId.toString());

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bookings/:id/cancel - Cancel a booking
router.post('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Booking already cancelled'
      });
    }

    // Update to cancelled
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release room in Redis
    const timeSlot = `${booking.startTime.toISOString()}_${booking.endTime.toISOString()}`;
    await RoomCache.releaseRoom(booking.roomId, timeSlot, booking.userId.toString());

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
