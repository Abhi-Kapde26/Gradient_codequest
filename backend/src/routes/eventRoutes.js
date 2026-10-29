import express from 'express';
import { eventController } from '../controllers/eventController.js';
import { teamController } from '../controllers/teamController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', eventController.listEvents);
router.post('/', requireAdmin, eventController.createEvent);
router.get('/:id', eventController.getEvent);
router.delete('/:id', requireAdmin, eventController.deleteEvent);
router.get('/:id/path', eventController.getEventPath);
router.post('/:id/nodes', requireAdmin, eventController.addNode);
router.get('/:id/teams', eventController.listTeams);
router.post('/:id/teams', requireAdmin, eventController.createTeam);
router.post('/:id/teams/bulk-create', requireAdmin, eventController.bulkCreateTeams);
router.post('/:id/teams/bulk-advance', requireAdmin, eventController.bulkAdvanceTeams);
router.post('/:id/teams/:id/advance', requireAdmin, teamController.advanceTeamNode);
router.post('/teams/:id/advance', requireAdmin, teamController.advanceTeamNode);
router.post('/:id/teams/seed-sample', requireAdmin, eventController.seedSampleTeams);
router.post('/:id/start-game', requireAdmin, eventController.startGame);
router.get('/:id/leaderboard', eventController.getLeaderboard);
router.get('/:id/submissions/pending', requireAdmin, eventController.getPendingSubmissions);

export default router;
