import express from 'express';
import { nodeController } from '../controllers/nodeController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.patch('/:id', requireAdmin, nodeController.updateNode);
router.delete('/:id', requireAdmin, nodeController.deleteNode);

export default router;
