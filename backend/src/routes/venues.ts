import { Router } from 'express';
import { venueController } from '../controllers/venues';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', venueController.getVenues);
router.get('/:id', venueController.getVenue);
router.post('/', authenticate, requireAdmin, venueController.createVenue);
router.put('/:id', authenticate, requireAdmin, venueController.updateVenue);

export default router;
