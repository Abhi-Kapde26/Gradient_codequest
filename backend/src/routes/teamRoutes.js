import express from 'express';
import { teamController } from '../controllers/teamController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', teamController.teamLogin);
router.get('/:id/current-node', teamController.getCurrentNode);
router.post('/:id/submissions', teamController.submitAnswer);
router.post('/:id/hints/unlock', teamController.unlockHint);
router.get('/:id/hints/:nodeId', teamController.getUnlockedHints);

// Admin Game Live Controls:
router.post('/:id/advance', requireAdmin, teamController.advanceTeamNode);
router.post('/:id/set-node', requireAdmin, teamController.setTeamNode);

export default router;
