import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean; // true if user has booked this event
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 200 },
    comment: { type: String, maxlength: 2000 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ event: 1, user: 1 }, { unique: true });
reviewSchema.index({ event: 1, rating: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
