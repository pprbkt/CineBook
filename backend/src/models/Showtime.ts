import mongoose, { Document, Schema } from 'mongoose';

export interface IShowtime extends Document {
  _id: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  venue: mongoose.Types.ObjectId;
  dateTime: Date;
  endTime: Date;
  bookedSeats: string[]; // array of seat IDs that are booked
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const showtimeSchema = new Schema<IShowtime>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
    dateTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    bookedSeats: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

showtimeSchema.index({ event: 1, dateTime: 1 });
showtimeSchema.index({ venue: 1, dateTime: 1 });
showtimeSchema.index({ dateTime: 1 });

export const Showtime = mongoose.model<IShowtime>('Showtime', showtimeSchema);
