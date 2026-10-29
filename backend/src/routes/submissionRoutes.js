import express from 'express';
import { submissionController } from '../controllers/submissionController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.patch('/:id/review', requireAdmin, submissionController.reviewSubmission);

export default router;
