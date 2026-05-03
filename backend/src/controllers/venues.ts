import { Request, Response, NextFunction } from 'express';
import { Venue } from '../models/Venue';
import { NotFoundError } from '../utils/errors';

export const venueController = {
  async getVenues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city } = req.query;
      const filter: any = { isActive: true };
      if (city) filter.city = new RegExp(city as string, 'i');
      const venues = await Venue.find(filter).select('-seatLayout');
      res.json({ success: true, data: { venues } });
    } catch (error) { next(error); }
  },

  async getVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await Venue.findById(req.params.id);
      if (!venue) throw new NotFoundError('Venue not found');
      res.json({ success: true, data: { venue } });
    } catch (error) { next(error); }
  },

  async createVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await Venue.create(req.body);
      res.status(201).json({ success: true, data: { venue } });
    } catch (error) { next(error); }
  },

  async updateVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!venue) throw new NotFoundError('Venue not found');
      res.json({ success: true, data: { venue } });
    } catch (error) { next(error); }
  },
};
