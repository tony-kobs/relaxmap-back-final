import { Router } from 'express';
import { celebrate } from 'celebrate';
import { authenticate } from '../middleware/authenticate.js';
import { getFeedbacks, createFeedback } from '../controllers/feedbackController.js';
import {
  feedbackQuerySchema,
  createFeedbackSchema,
} from '../validations/feedbackValidation.js';

const router = Router();

router.get('/feedbacks', celebrate(feedbackQuerySchema), getFeedbacks);
router.post('/feedbacks', authenticate, celebrate(createFeedbackSchema), createFeedback);

export default router;
