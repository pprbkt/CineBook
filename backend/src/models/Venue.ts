import mongoose, { Document, Schema } from 'mongoose';

export interface ISeatLayout {
  row: string;
  number: number;
  type: 'standard' | 'premium' | 'vip';
  price: number;
  x: number; // 3D position
  y: number;
  z: number;
  isAccessible: boolean;
}

export interface IVenue extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: string;
  city: string;
  capacity: number;
  seatLayout: ISeatLayout[];
  screenWidth: number; // for 3D preview
  screenHeight: number;
  screenDistance: number;
  hallType: 'standard' | 'imax' | 'dolby' | 'open_air' | 'stadium';
  amenities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seatLayoutSchema = new Schema<ISeatLayout>(
  {
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: { type: String, enum: ['standard', 'premium', 'vip'], default: 'standard' },
    price: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
    isAccessible: { type: Boolean, default: false },
  },
  { _id: true }
);

const venueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    capacity: { type: Number, required: true },
    seatLayout: [seatLayoutSchema],
    screenWidth: { type: Number, default: 15 },
    screenHeight: { type: Number, default: 8 },
    screenDistance: { type: Number, default: 5 },
    hallType: { type: String, enum: ['standard', 'imax', 'dolby', 'open_air', 'stadium'], default: 'standard' },
    amenities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

venueSchema.index({ city: 1 });
venueSchema.index({ hallType: 1 });

export const Venue = mongoose.model<IVenue>('Venue', venueSchema);
