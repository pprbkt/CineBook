import { Router } from 'express';
import { reviewController } from '../controllers/reviews';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, reviewController.createReview);
router.get('/event/:eventId', reviewController.getEventReviews);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
