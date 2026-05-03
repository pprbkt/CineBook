import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  showtime: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  venue: mongoose.Types.ObjectId;
  seats: {
    seatId: string;
    row: string;
    number: number;
    type: string;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  ticketCode: string;
  qrCode?: string;
  bookingDate: Date;
  cancellationDate?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    showtime: { type: Schema.Types.ObjectId, ref: 'Showtime', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
    seats: [
      {
        seatId: { type: String, required: true },
        row: { type: String, required: true },
        number: { type: Number, required: true },
        type: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    ticketCode: { type: String, required: true, unique: true },
    qrCode: { type: String },
    bookingDate: { type: Date, default: Date.now },
    cancellationDate: { type: Date },
    refundAmount: { type: Number },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ showtime: 1 });
bookingSchema.index({ ticketCode: 1 });
bookingSchema.index({ razorpayOrderId: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
