import { Router } from 'express';
import { eventController } from '../controllers/events';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', eventController.getEvents);
router.get('/featured', eventController.getFeatured);
router.get('/categories', eventController.getCategories);
router.get('/recommendations', optionalAuth, eventController.getRecommendations);
router.get('/:id', optionalAuth, eventController.getEvent);
router.get('/:id/similar', eventController.getSimilar);

// Admin
router.post('/', authenticate, requireAdmin, eventController.createEvent);
router.put('/:id', authenticate, requireAdmin, eventController.updateEvent);
router.delete('/:id', authenticate, requireAdmin, eventController.deleteEvent);

export default router;
