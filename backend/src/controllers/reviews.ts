import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ConflictError } from '../utils/errors';
import { reviewSchema } from '../utils/validators';
import { recommendationService } from '../services/recommendation';

export const reviewController = {
  async createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = reviewSchema.parse(req.body);
      const userId = req.user!._id.toString();

      const existing = await Review.findOne({ user: userId, event: data.eventId });
      if (existing) throw new ConflictError('You already reviewed this event');

      const hasBooked = await Booking.findOne({ user: userId, event: data.eventId, status: 'confirmed' });

      const review = await Review.create({
        user: userId, event: data.eventId, rating: data.rating,
        title: data.title, comment: data.comment, isVerified: !!hasBooked,
      });

      // Update event average rating
      const stats = await Review.aggregate([
        { $match: { event: review.event } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (stats.length) {
        await Event.findByIdAndUpdate(data.eventId, { avgRating: Math.round(stats[0].avgRating * 10) / 10, totalReviews: stats[0].count });
      }

      await recommendationService.updateUserPreferences(userId, 'rate', { eventId: data.eventId, rating: data.rating });
      await review.populate('user', 'name avatar');

      res.status(201).json({ success: true, data: { review } });
    } catch (error) { next(error); }
  },

  async getEventReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '10' } = req.query;
      const p = parseInt(page as string); const l = parseInt(limit as string);
      const [reviews, total] = await Promise.all([
        Review.find({ event: req.params.eventId }).populate('user', 'name avatar').sort('-createdAt').skip((p-1)*l).limit(l),
        Review.countDocuments({ event: req.params.eventId }),
      ]);
      res.json({ success: true, data: { reviews, pagination: { page: p, limit: l, total, pages: Math.ceil(total/l) } } });
    } catch (error) { next(error); }
  },

  async deleteReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
      if (!review) throw new NotFoundError('Review not found');
      const stats = await Review.aggregate([{ $match: { event: review.event } }, { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }]);
      await Event.findByIdAndUpdate(review.event, { avgRating: stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0, totalReviews: stats.length ? stats[0].count : 0 });
      res.json({ success: true, message: 'Review deleted' });
    } catch (error) { next(error); }
  },
};
