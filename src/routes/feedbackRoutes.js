import { Router } from 'express';
import { celebrate } from 'celebrate';
import { authenticate } from '../middleware/authenticate.js';
import {
  getFeedbacks,
  createFeedback,
  deleteFeedback,
} from '../controllers/feedbackController.js';
import {
  feedbackQuerySchema,
  createFeedbackSchema,
  feedbackIdSchema,
} from '../validations/feedbackValidation.js';

const router = Router();

router.get('/', celebrate(feedbackQuerySchema), getFeedbacks);
router.post('/', authenticate, celebrate(createFeedbackSchema), createFeedback);
router.delete(
  '/:feedbackId',
  authenticate,
  celebrate(feedbackIdSchema),
  deleteFeedback,
);

export default router;
