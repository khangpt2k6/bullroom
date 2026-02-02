import mongoose, { Schema } from 'mongoose';
import { IRoom } from '../types';

const roomSchema = new Schema<IRoom>({
  _id: {
    type: String, // Custom ID like "LIB-224", "MSC-2707"
    required: true
  },
  building: {
    type: String,
    required: true,
    enum: ['Library', 'MSC', 'ENB']
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Individual', 'Group', 'Large Group']
  },
  capacity: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
roomSchema.index({ building: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ building: 1, floor: 1 });

export default mongoose.model<IRoom>('Room', roomSchema);
