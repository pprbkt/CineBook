import { Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Showtime } from '../models/Showtime';
import { Review } from '../models/Review';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { eventSchema } from '../utils/validators';
import { recommendationService } from '../services/recommendation';

export const eventController = {
  // Get all events with filtering
  async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        category,
        genre,
        search,
        featured,
        page = '1',
        limit = '12',
        sort = '-releaseDate',
      } = req.query;

      const filter: any = { isActive: true };

      if (category) filter.category = category;
      if (genre) filter.genre = { $in: (genre as string).split(',') };
      if (featured === 'true') filter.isFeatured = true;
      if (search) {
        filter.$text = { $search: search as string };
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [events, total] = await Promise.all([
        Event.find(filter)
          .sort(sort as string)
          .skip(skip)
          .limit(limitNum),
        Event.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single event with showtimes
  async getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) throw new NotFoundError('Event not found');

      const showtimes = await Showtime.find({
        event: event._id,
        isActive: true,
        dateTime: { $gte: new Date() },
      })
        .populate('venue')
        .sort('dateTime');

      const reviews = await Review.find({ event: event._id })
        .populate('user', 'name avatar')
        .sort('-createdAt')
        .limit(10);

      // Track view for recommendations
      if ((req as AuthRequest).user) {
        recommendationService.updateUserPreferences(
          (req as AuthRequest).user!._id.toString(),
          'view',
          { eventId: event._id }
        );
      }

      res.json({
        success: true,
        data: { event, showtimes, reviews },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get featured events
  async getFeatured(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await Event.find({ isActive: true, isFeatured: true })
        .sort('-avgRating')
        .limit(8);

      res.json({ success: true, data: { events } });
    } catch (error) {
      next(error);
    }
  },

  // Get personalized recommendations
  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id.toString();
      let events;

      if (userId) {
        events = await recommendationService.getPersonalizedRecommendations(userId);
      } else {
        events = await recommendationService.getPopularEvents();
      }

      res.json({ success: true, data: { events } });
    } catch (error) {
      next(error);
    }
  },

  // Get similar events
  async getSimilar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await recommendationService.getSimilarEvents(req.params.id);
      res.json({ success: true, data: { events } });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Create event
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = eventSchema.parse(req.body);
      const event = await Event.create(data);
      res.status(201).json({ success: true, data: { event } });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Update event
  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!event) throw new NotFoundError('Event not found');
      res.json({ success: true, data: { event } });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Delete event
  async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await Event.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!event) throw new NotFoundError('Event not found');
      res.json({ success: true, message: 'Event deactivated' });
    } catch (error) {
      next(error);
    }
  },

  // Get all categories with count
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await Event.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      res.json({ success: true, data: { categories } });
    } catch (error) {
      next(error);
    }
  },
};
