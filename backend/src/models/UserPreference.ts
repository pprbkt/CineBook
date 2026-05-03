import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreference extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  favoriteGenres: string[];
  favoriteCategories: string[];
  preferredSeatType: 'standard' | 'premium' | 'vip';
  preferredSeatPosition: 'front' | 'middle' | 'back';
  preferredSeatSide: 'left' | 'center' | 'right' | 'aisle';
  viewedEvents: mongoose.Types.ObjectId[];
  bookedEvents: mongoose.Types.ObjectId[];
  ratedEvents: { event: mongoose.Types.ObjectId; rating: number }[];
  searchHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    favoriteGenres: [{ type: String }],
    favoriteCategories: [{ type: String }],
    preferredSeatType: { type: String, enum: ['standard', 'premium', 'vip'], default: 'standard' },
    preferredSeatPosition: { type: String, enum: ['front', 'middle', 'back'], default: 'middle' },
    preferredSeatSide: { type: String, enum: ['left', 'center', 'right', 'aisle'], default: 'center' },
    viewedEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    bookedEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
    ratedEvents: [
      {
        event: { type: Schema.Types.ObjectId, ref: 'Event' },
        rating: { type: Number, min: 1, max: 5 },
      },
    ],
    searchHistory: [{ type: String }],
  },
  { timestamps: true }
);

userPreferenceSchema.index({ user: 1 });

export const UserPreference = mongoose.model<IUserPreference>('UserPreference', userPreferenceSchema);
