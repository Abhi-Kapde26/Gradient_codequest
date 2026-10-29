import { dbService } from '../services/dbService.js';

export const eventController = {
  async listEvents(req, res) {
    try {
      const events = await dbService.listEvents();
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getEvent(req, res) {
    try {
      const event = await dbService.getEvent(req.params.id);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createEvent(req, res) {
    try {
      const { title, description, status } = req.body;
      if (!title) return res.status(400).json({ error: 'Title is required' });
      const event = await dbService.createEvent({ title, description, status });
      res.status(201).json(event);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteEvent(req, res) {
    try {
      const result = await dbService.deleteEvent(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getEventPath(req, res) {
    try {
      const nodes = await dbService.getEventPath(req.params.id);
      res.json(nodes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async addNode(req, res) {
    try {
      const node = await dbService.addNode(req.params.id, req.body);
      res.status(201).json(node);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async createTeam(req, res) {
    try {
      const team = await dbService.createTeam(req.params.id, req.body);
      res.status(201).json(team);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async bulkCreateTeams(req, res) {
    try {
      const { teams } = req.body || {};
      const result = await dbService.bulkCreateTeams(req.params.id, teams);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async listTeams(req, res) {
    try {
      const teams = await dbService.listTeams(req.params.id);
      res.json(teams);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getLeaderboard(req, res) {
    try {
      const leaderboard = await dbService.getLeaderboard(req.params.id);
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getPendingSubmissions(req, res) {
    try {
      const pending = await dbService.getPendingSubmissions(req.params.id);
      res.json(pending);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async bulkAdvanceTeams(req, res) {
    try {
      const { teamIds, awardPoints = true } = req.body || {};
      const result = await dbService.bulkAdvanceTeams(teamIds, { awardPoints });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async startGame(req, res) {
    try {
      const { resetAll = false } = req.body || {};
      const result = await dbService.startGame(req.params.id, { resetAll });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async seedSampleTeams(req, res) {
    try {
      const { count = 10 } = req.body || {};
      const result = await dbService.seedSampleTeams(req.params.id, count);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
