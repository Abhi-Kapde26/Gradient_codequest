import { dbService } from '../services/dbService.js';

export const nodeController = {
  async updateNode(req, res) {
    try {
      const updated = await dbService.updateNode(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async deleteNode(req, res) {
    try {
      const result = await dbService.deleteNode(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
