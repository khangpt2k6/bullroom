import mongoose, { Schema, Model } from 'mongoose';
import { IBooking } from '../types';

interface IBookingModel extends Model<IBooking> {
  hasConflict(
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<boolean>;
}

const bookingSchema = new Schema<IBooking, IBookingModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: String,
    ref: 'Room',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  }
});

// Compound index for conflict detection
bookingSchema.index({ roomId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ status: 1 });

// Static method to check booking conflicts
bookingSchema.statics.hasConflict = async function(
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const query: any = {
    roomId,
    status: { $in: ['PENDING', 'CONFIRMED'] },
    $or: [
      // New booking starts during existing booking
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New booking ends during existing booking
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New booking completely contains existing booking
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await this.findOne(query);
  return !!conflict;
};

export default mongoose.model<IBooking, IBookingModel>('Booking', bookingSchema);
