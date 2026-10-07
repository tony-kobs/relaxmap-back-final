import { Router } from 'express';
import { validate } from '../middleware/validate.js';
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

router.get('/', validate(feedbackQuerySchema), getFeedbacks);
router.post('/', authenticate, validate(createFeedbackSchema), createFeedback);
router.delete(
  '/:feedbackId',
  authenticate,
  validate(feedbackIdSchema),
  deleteFeedback,
);

export default router;
