import { Router } from 'express';
import { getRegions, getTypes } from '../controllers/categoryController.js';

const router = Router();

router.get('/regions', getRegions);
router.get('/types', getTypes);

export default router;
