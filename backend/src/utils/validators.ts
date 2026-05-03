import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['movie', 'concert', 'sports', 'theatre']),
  genre: z.array(z.string()).min(1),
  duration: z.number().min(1),
  language: z.string().optional(),
  rating: z.string().optional(),
  cast: z.array(z.string()).optional(),
  director: z.string().optional(),
  posterUrl: z.string().url().optional(),
  trailerUrl: z.string().url().optional(),
  releaseDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const reviewSchema = z.object({
  eventId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export const bookingSchema = z.object({
  showtimeId: z.string().min(1),
  seatIds: z.array(z.string()).min(1).max(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
