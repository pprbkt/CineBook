import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'movie' | 'concert' | 'sports' | 'theatre';
  genre: string[];
  duration: number; // in minutes
  language?: string;
  rating?: string; // PG, PG-13, R, etc.
  cast: string[];
  director?: string;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  releaseDate?: Date;
  tags: string[];
  avgRating: number;
  totalReviews: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, enum: ['movie', 'concert', 'sports', 'theatre'] },
    genre: [{ type: String, required: true }],
    duration: { type: Number, required: true },
    language: { type: String, default: 'English' },
    rating: { type: String },
    cast: [{ type: String }],
    director: { type: String },
    posterUrl: { type: String, default: '' },
    bannerUrl: { type: String },
    trailerUrl: { type: String },
    releaseDate: { type: Date },
    tags: [{ type: String }],
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ category: 1 });
eventSchema.index({ genre: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' }, { language_override: 'textSearchLanguage' });
eventSchema.index({ avgRating: -1 });
eventSchema.index({ releaseDate: -1 });
eventSchema.index({ isFeatured: 1, isActive: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
