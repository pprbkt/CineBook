import { Request, Response, NextFunction } from 'express';
import { Showtime } from '../models/Showtime';
import { Venue } from '../models/Venue';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { seatLockManager } from '../config/redis';
import { seatRecommendationService } from '../services/seatRecommendation';

export const showtimeController = {
  // Get showtime with seat availability
  async getShowtime(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const showtime = await Showtime.findById(req.params.id)
        .populate('event')
        .populate('venue');

      if (!showtime) throw new NotFoundError('Showtime not found');

      // Get current seat locks
      const locks = await seatLockManager.getSeatLocks(showtime._id.toString());

      res.json({
        success: true,
        data: {
          showtime,
          lockedSeats: locks,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get smart seat recommendations
  async getSeatRecommendations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const showtime = await Showtime.findById(req.params.id).populate('venue');
      if (!showtime) throw new NotFoundError('Showtime not found');

      const venue = await Venue.findById(showtime.venue);
      if (!venue) throw new NotFoundError('Venue not found');

      const locks = await seatLockManager.getSeatLocks(showtime._id.toString());
      const lockedSeatIds = Object.keys(locks);

      const recommendations = await seatRecommendationService.getSmartRecommendations(
        venue.seatLayout as any,
        showtime.bookedSeats,
        lockedSeatIds,
        req.user?._id.toString()
      );

      res.json({
        success: true,
        data: { recommendations },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get showtimes for an event
  async getShowtimesByEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, city } = req.query;
      const filter: any = {
        event: req.params.eventId,
        isActive: true,
        dateTime: { $gte: new Date() },
      };

      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        filter.dateTime = { $gte: startDate, $lt: endDate };
      }

      let showtimes = await Showtime.find(filter)
        .populate('venue')
        .sort('dateTime');

      if (city) {
        showtimes = showtimes.filter(
          (s: any) => s.venue?.city?.toLowerCase() === (city as string).toLowerCase()
        );
      }

      res.json({ success: true, data: { showtimes } });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Create showtime
  async createShowtime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, venueId, dateTime, endTime } = req.body;

      const venue = await Venue.findById(venueId);
      if (!venue) throw new NotFoundError('Venue not found');

      const showtime = await Showtime.create({
        event: eventId,
        venue: venueId,
        dateTime: new Date(dateTime),
        endTime: new Date(endTime),
      });

      res.status(201).json({ success: true, data: { showtime } });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Update showtime
  async updateShowtime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!showtime) throw new NotFoundError('Showtime not found');
      res.json({ success: true, data: { showtime } });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Delete showtime
  async deleteShowtime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await Showtime.findByIdAndUpdate(req.params.id, { isActive: false });
      res.json({ success: true, message: 'Showtime deactivated' });
    } catch (error) {
      next(error);
    }
  },
};
