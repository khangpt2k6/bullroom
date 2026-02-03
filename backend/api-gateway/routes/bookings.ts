import express, { Request, Response, Router } from 'express';
import Booking from '../../shared/models/Booking';
import Room from '../../shared/models/Room';
import User from '../../shared/models/User';
import { publishBookingRequest, publishEmailNotification } from '../../shared/utils/rabbitmq';
import { RoomCache } from '../../shared/utils/redis';
import { CreateBookingRequest, BookingFilterQuery } from '../../shared/types';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();

// POST /api/bookings - Create new booking request
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Use authenticated user ID from token instead of request body
    const userId = req.userId!; // Non-null assertion safe because requireAuth guarantees userId
    const { roomId, startTime, endTime } = req.body;

    // Validation
    if (!roomId || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: roomId, startTime, endTime'
      });
      return;
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found'
      });
      return;
    }

    // Validate time
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
      return;
    }

    if (start < new Date()) {
      res.status(400).json({
        success: false,
        error: 'Cannot book in the past'
      });
      return;
    }

    // Check for conflicts in MongoDB (database-level validation)
    const hasConflict = await (Booking as any).hasConflict(roomId, start, end);
    if (hasConflict) {
      res.status(409).json({
        success: false,
        error: 'This time slot conflicts with an existing booking'
      });
      return;
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

    // Send booking created notification via RabbitMQ to notification service
    await publishEmailNotification({
      bookingId: booking._id.toString(),
      userId,
      userEmail: req.userEmail,
      roomId,
      startTime: startTime,
      endTime: endTime,
      type: 'booking_created',
      message: `Your booking for room ${roomId} has been created and is pending confirmation. Please confirm within 10 minutes or it will be automatically cancelled.`
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/bookings - Get all bookings (with filters)
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Always filter by authenticated user's ID for security
    const userId = req.userId!;
    const { roomId, status } = req.query as Omit<BookingFilterQuery, 'userId'>;

    const query: any = { userId }; // Always filter by authenticated user
    if (roomId) query.roomId = roomId;
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
      return;
    }

    // Verify the booking belongs to the authenticated user
    if (booking.userId !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view this booking'
      });
      return;
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// POST /api/bookings/:id/confirm - Confirm a held booking
router.post('/:id/confirm', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
      return;
    }

    // Verify the booking belongs to the authenticated user
    if (booking.userId !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to confirm this booking'
      });
      return;
    }

    if (booking.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: `Cannot confirm booking with status: ${booking.status}`
      });
      return;
    }

    // Update to confirmed
    booking.status = 'CONFIRMED';
    booking.confirmedAt = new Date();
    await booking.save();

    // Update Redis
    const timeSlot = `${booking.startTime.toISOString()}_${booking.endTime.toISOString()}`;
    await RoomCache.confirmBooking(booking.roomId, timeSlot, booking.userId, booking.endTime.toISOString());

    // Send confirmation email notification via RabbitMQ to notification service
    await publishEmailNotification({
      bookingId: booking._id.toString(),
      userId: booking.userId,
      userEmail: req.userEmail,
      roomId: booking.roomId,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      type: 'booking_confirmed',
      message: `🎉 Your booking for room ${booking.roomId} has been confirmed! Time: ${booking.startTime.toLocaleString()} - ${booking.endTime.toLocaleString()}`
    });

    res.json({
      success: true,
      message: 'Booking confirmed successfully. A confirmation email has been sent.',
      booking
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// POST /api/bookings/:id/cancel - Cancel a booking
router.post('/:id/cancel', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
      return;
    }

    // Verify the booking belongs to the authenticated user
    if (booking.userId !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel this booking'
      });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        error: 'Booking already cancelled'
      });
      return;
    }

    // Update to cancelled
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release room in Redis
    const timeSlot = `${booking.startTime.toISOString()}_${booking.endTime.toISOString()}`;
    await RoomCache.releaseRoom(booking.roomId, timeSlot, booking.userId);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
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
