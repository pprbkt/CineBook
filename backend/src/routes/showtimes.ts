import { Router } from 'express';
import { showtimeController } from '../controllers/showtimes';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/event/:eventId', showtimeController.getShowtimesByEvent);
router.get('/:id', optionalAuth, showtimeController.getShowtime);
router.get('/:id/seat-recommendations', optionalAuth, showtimeController.getSeatRecommendations);

// Admin
router.post('/', authenticate, requireAdmin, showtimeController.createShowtime);
router.put('/:id', authenticate, requireAdmin, showtimeController.updateShowtime);
router.delete('/:id', authenticate, requireAdmin, showtimeController.deleteShowtime);

export default router;
