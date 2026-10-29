// API Service for Gradient CodeQuest
// Note: Frontend only uses public keys or user tokens. Service-role keys are strictly on the backend.

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'API Request Failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Events
  async getEvents() {
    return request('/events');
  },

  async getEvent(id) {
    return request(`/events/${id}`);
  },

  async createEvent(eventData, adminKey) {
    return request('/events', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify(eventData)
    });
  },

  async deleteEvent(id, adminKey) {
    return request(`/events/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey }
    });
  },

  // Game Path & Nodes
  async getEventPath(eventId) {
    return request(`/events/${eventId}/path`);
  },

  async addNode(eventId, nodeData, adminKey) {
    return request(`/events/${eventId}/nodes`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify(nodeData)
    });
  },

  async updateNode(nodeId, nodeData, adminKey) {
    return request(`/nodes/${nodeId}`, {
      method: 'PATCH',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify(nodeData)
    });
  },

  async deleteNode(nodeId, adminKey) {
    return request(`/nodes/${nodeId}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey }
    });
  },

  // Teams & Players
  async listTeams(eventId) {
    return request(`/events/${eventId}/teams`);
  },

  async createTeam(eventId, teamData, adminKey) {
    return request(`/events/${eventId}/teams`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify(teamData)
    });
  },

  async bulkCreateTeams(eventId, teams, adminKey) {
    return request(`/events/${eventId}/teams/bulk-create`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ teams })
    });
  },

  async teamLogin(accessCode) {
    return request('/teams/login', {
      method: 'POST',
      body: JSON.stringify({ accessCode })
    });
  },

  // Leaderboard
  async getLeaderboard(eventId) {
    return request(`/events/${eventId}/leaderboard`);
  },

  // Team Game & Submissions
  async getTeamCurrentNode(teamId) {
    return request(`/teams/${teamId}/current-node`);
  },

  async submitAnswer(teamId, content, submittedBy) {
    return request(`/teams/${teamId}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ content, submittedBy })
    });
  },

  // Admin Reviews
  async getPendingSubmissions(eventId, adminKey) {
    return request(`/events/${eventId}/submissions/pending`, {
      headers: { 'x-admin-key': adminKey }
    });
  },

  async reviewSubmission(submissionId, { status, feedback }, adminKey) {
    return request(`/submissions/${submissionId}/review`, {
      method: 'PATCH',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ status, feedback })
    });
  },

  // Admin Game Live Controls & Node Updates
  async advanceTeam(teamId, { awardPoints = true, customPoints = null } = {}, adminKey) {
    return request(`/teams/${teamId}/advance`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ awardPoints, customPoints })
    });
  },

  async setTeamNode(teamId, position, adminKey) {
    return request(`/teams/${teamId}/set-node`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ position })
    });
  },

  async bulkAdvanceTeams(eventId, teamIds, { awardPoints = true } = {}, adminKey) {
    return request(`/events/${eventId}/teams/bulk-advance`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ teamIds, awardPoints })
    });
  },

  async startGame(eventId, { resetAll = false } = {}, adminKey) {
    return request(`/events/${eventId}/start-game`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ resetAll })
    });
  },

  async seedSampleTeams(eventId, count = 10, adminKey) {
    return request(`/events/${eventId}/teams/seed-sample`, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify({ count })
    });
  },

  // Hints & Debugging Tasks
  async unlockHint(teamId, nodeId, debuggingAnswer) {
    return request(`/teams/${teamId}/hints/unlock`, {
      method: 'POST',
      body: JSON.stringify({ nodeId, debuggingAnswer })
    });
  },

  async getUnlockedHints(teamId, nodeId) {
    return request(`/teams/${teamId}/hints/${nodeId}`);
  }
};
