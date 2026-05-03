import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Booking } from '../models/Booking';
import { Showtime } from '../models/Showtime';
import { Venue } from '../models/Venue';
import { AuthRequest } from '../middleware/auth';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { seatLockManager } from '../config/redis';
import { ticketService } from '../services/ticket';
import { emailService } from '../services/email';
import { recommendationService } from '../services/recommendation';
import { logger } from '../utils/logger';

function generateTicketCode(): string {
  return 'CB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

export const bookingController = {
  async createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { showtimeId, seatIds } = req.body;
      const userId = req.user!._id.toString();
      if (!seatIds?.length) throw new BadRequestError('No seats selected');
      if (seatIds.length > 10) throw new BadRequestError('Max 10 seats');

      const showtime = await Showtime.findById(showtimeId).populate('event venue');
      if (!showtime) throw new NotFoundError('Showtime not found');

      const venue = await Venue.findById(showtime.venue);
      if (!venue) throw new NotFoundError('Venue not found');

      const alreadyBooked = seatIds.filter((id: string) => showtime.bookedSeats.includes(id));
      if (alreadyBooked.length) throw new ConflictError(`Seats booked: ${alreadyBooked.join(', ')}`);

      const seatDetails = seatIds.map((seatId: string) => {
        const seat = venue.seatLayout.find((s: any) => s._id.toString() === seatId);
        if (!seat) throw new NotFoundError(`Seat ${seatId} not found`);
        return { seatId, row: seat.row, number: seat.number, type: seat.type, price: seat.price };
      });

      const totalAmount = seatDetails.reduce((sum: number, s: any) => sum + s.price, 0);

      const booking = await Booking.create({
        user: userId, showtime: showtimeId, event: (showtime.event as any)._id,
        venue: venue._id, seats: seatDetails, totalAmount, ticketCode: generateTicketCode(), status: 'pending',
      });

      res.status(201).json({ success: true, data: { booking, totalAmount } });
    } catch (error) { next(error); }
  },

  async confirmBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const booking = await Booking.findOne({ _id: req.params.id, user: userId }).populate('event venue showtime');
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.status !== 'pending') throw new BadRequestError('Not pending');

      const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
      if (razorpayPaymentId) {
        booking.razorpayPaymentId = razorpayPaymentId;
        booking.razorpayOrderId = razorpayOrderId;
        booking.razorpaySignature = razorpaySignature;
      }

      booking.status = 'confirmed';
      booking.qrCode = await ticketService.generateQRCode(JSON.stringify({ bookingId: booking._id, ticketCode: booking.ticketCode }));
      await booking.save();

      await Showtime.findByIdAndUpdate(booking.showtime, { $addToSet: { bookedSeats: { $each: booking.seats.map(s => s.seatId) } } });
      for (const seat of booking.seats) await seatLockManager.unlockSeat(booking.showtime.toString(), seat.seatId, userId);

      const event = booking.event as any;
      await recommendationService.updateUserPreferences(userId, 'book', { eventId: event._id, genres: event.genre, category: event.category });

      let pdfBuffer: Buffer | undefined;
      try { pdfBuffer = await ticketService.generateTicketPDF(booking); } catch (e) { logger.error('PDF error:', e); }
      emailService.sendBookingConfirmation(req.user!.email, booking, pdfBuffer);

      const io = req.app.get('io');
      if (io) io.to(`showtime:${booking.showtime}`).emit('seats:booked', { showtimeId: booking.showtime.toString(), seatIds: booking.seats.map(s => s.seatId) });

      res.json({ success: true, data: { booking } });
    } catch (error) { next(error); }
  },

  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await Booking.find({ user: req.user!._id }).populate('event', 'title posterUrl category').populate('venue', 'name city').populate('showtime', 'dateTime').sort('-createdAt');
      res.json({ success: true, data: { bookings } });
    } catch (error) { next(error); }
  },

  async getBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await Booking.findOne({ _id: req.params.id, user: req.user!._id }).populate('event venue showtime');
      if (!booking) throw new NotFoundError('Booking not found');
      res.json({ success: true, data: { booking } });
    } catch (error) { next(error); }
  },

  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await Booking.findOne({ _id: req.params.id, user: req.user!._id }).populate('event venue');
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.status !== 'confirmed') throw new BadRequestError('Only confirmed bookings');

      const showtime = await Showtime.findById(booking.showtime);
      const hoursBeforeShow = showtime ? (showtime.dateTime.getTime() - Date.now()) / 3600000 : 0;
      const refundPct = hoursBeforeShow > 24 ? 1 : hoursBeforeShow > 2 ? 0.5 : 0;

      booking.status = 'cancelled';
      booking.cancellationDate = new Date();
      booking.refundAmount = booking.totalAmount * refundPct;
      await booking.save();

      if (showtime) {
        showtime.bookedSeats = showtime.bookedSeats.filter(id => !booking.seats.some(s => s.seatId === id));
        await showtime.save();
        const io = req.app.get('io');
        if (io) io.to(`showtime:${showtime._id}`).emit('seats:released', { showtimeId: showtime._id.toString(), seatIds: booking.seats.map(s => s.seatId) });
      }

      emailService.sendCancellationConfirmation(req.user!.email, booking);
      res.json({ success: true, data: { booking, refundAmount: booking.refundAmount } });
    } catch (error) { next(error); }
  },

  async downloadTicket(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await Booking.findOne({ _id: req.params.id, user: req.user!._id, status: 'confirmed' }).populate('event venue showtime');
      if (!booking) throw new NotFoundError('Booking not found');
      const pdfBuffer = await ticketService.generateTicketPDF(booking);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=CineBook_${booking.ticketCode}.pdf`);
      res.send(pdfBuffer);
    } catch (error) { next(error); }
  },

  async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (status) filter.status = status;
      const p = parseInt(page as string); const l = parseInt(limit as string);
      const [bookings, total] = await Promise.all([
        Booking.find(filter).populate('user', 'name email').populate('event', 'title').populate('venue', 'name').populate('showtime', 'dateTime').sort('-createdAt').skip((p-1)*l).limit(l),
        Booking.countDocuments(filter),
      ]);
      res.json({ success: true, data: { bookings, pagination: { page: p, limit: l, total, pages: Math.ceil(total/l) } } });
    } catch (error) { next(error); }
  },
};
