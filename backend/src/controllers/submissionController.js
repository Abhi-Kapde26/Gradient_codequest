import { dbService } from '../services/dbService.js';

export const submissionController = {
  async reviewSubmission(req, res) {
    try {
      const { status, feedback, reviewedBy } = req.body;
      const result = await dbService.reviewSubmission(req.params.id, {
        status,
        feedback,
        reviewedBy: reviewedBy || (req.user ? req.user.name : 'Admin')
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
