import { dbService } from '../services/dbService.js';

export const teamController = {
  async teamLogin(req, res) {
    try {
      const { accessCode } = req.body;
      if (!accessCode) {
        return res.status(400).json({ error: 'Access code is required.' });
      }
      const team = await dbService.getTeamByAccessCode(accessCode);
      if (!team) {
        return res.status(404).json({ error: 'Invalid team access code. Please verify credentials.' });
      }
      res.json(team);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getCurrentNode(req, res) {
    try {
      const data = await dbService.getTeamCurrentNode(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async submitAnswer(req, res) {
    try {
      const { content, submittedBy } = req.body;
      const submission = await dbService.submitAnswer(req.params.id, { content, submittedBy });
      res.status(201).json(submission);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async unlockHint(req, res) {
    try {
      const { nodeId, debuggingAnswer } = req.body;
      const result = await dbService.unlockHint(req.params.id, nodeId, debuggingAnswer);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getUnlockedHints(req, res) {
    try {
      const hints = await dbService.getUnlockedHints(req.params.id, req.params.nodeId);
      res.json(hints);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async advanceTeamNode(req, res) {
    try {
      const { awardPoints = true, customPoints = null } = req.body || {};
      const result = await dbService.advanceTeamNode(req.params.id, { awardPoints, customPoints });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async setTeamNode(req, res) {
    try {
      const { position } = req.body || {};
      const result = await dbService.setTeamNode(req.params.id, position);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
