import { Router } from 'express';
import { bookingController } from '../controllers/bookings';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, bookingController.createBooking);
router.post('/:id/confirm', authenticate, bookingController.confirmBooking);
router.get('/my', authenticate, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getBooking);
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);
router.get('/:id/ticket', authenticate, bookingController.downloadTicket);

// Admin
router.get('/', authenticate, requireAdmin, bookingController.getAllBookings);

export default router;
