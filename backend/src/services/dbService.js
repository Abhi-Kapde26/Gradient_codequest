import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import crypto from 'crypto';

// In-memory / local fallback data seeded for development and offline tests
const localDb = {
  users: [
    { id: '11111111-1111-1111-1111-111111111111', email: 'admin@codequest.org', role: 'admin', name: 'Super Admin' },
    { id: '22222222-2222-2222-2222-222222222222', email: 'lead@teamalpha.org', role: 'player', name: 'Alpha Leader' }
  ],
  events: [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Gradient CodeQuest 2026',
      description: 'Premier game-based competitive programming tournament',
      status: 'active',
      created_by: '11111111-1111-1111-1111-111111111111',
      created_at: new Date().toISOString()
    }
  ],
  game_nodes: [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      position: 1,
      type: 'START',
      title: 'Initialization Gate',
      challenge_statement: 'Welcome contestants! To pass the Initialization Gate, decode the binary greeting: 01000111 01000011 01010001. Enter the decoded ASCII string.',
      points: 50,
      expected_answer: 'GCQ',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000002-0000-0000-0000-000000000002',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      position: 2,
      type: 'QUEST',
      title: 'Algorithmic Ascent',
      challenge_statement: 'Given an array of integers [3, 1, 4, 1, 5, 9, 2, 6, 5], find the length of the longest strictly increasing subsequence (LIS). Submit the number.',
      points: 100,
      expected_answer: '4',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000003-0000-0000-0000-000000000003',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      position: 3,
      type: 'TREASURE_HUNT',
      title: 'Cryptic Cipher',
      challenge_statement: 'Decrypt this Caesar cipher shifted by 7: "GRAVRAG PQA". What is the original text uppercase?',
      points: 150,
      expected_answer: 'GRADIENT CQ',
      created_at: new Date().toISOString()
    },
    {
      id: 'b0000004-0000-0000-0000-000000000004',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      position: 4,
      type: 'FINISH',
      title: 'Grand Zenith',
      challenge_statement: 'Final test: Compute the sum of all primes strictly below 30. Enter the integer sum.',
      points: 200,
      expected_answer: '129',
      created_at: new Date().toISOString()
    }
  ],
  node_hints: [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      node_id: 'b0000002-0000-0000-0000-000000000002',
      hint_number: 1,
      hint_text: 'Hint: Consider subsequences like [1, 4, 5, 9] or [1, 2, 5, 6]. What is their length?',
      debugging_task: 'Debug task: Fix this JS bug: `const lis = [1,3,5]; lis.len;` What property returns array size?',
      debugging_answer: 'length'
    },
    {
      id: 'c0000002-0000-0000-0000-000000000002',
      node_id: 'b0000003-0000-0000-0000-000000000003',
      hint_number: 1,
      hint_text: 'Hint: Shift each character backwards by 7 or analyze letter frequencies.',
      debugging_task: 'Debug task: In Python, `ord("A")` is 65. What is `chr(66)`?',
      debugging_answer: 'B'
    }
  ],
  teams: [
    {
      id: 'd0000001-0000-0000-0000-000000000001',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Binary Bandits',
      access_code: 'TEAM-ALPHA-101',
      score: 50,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'd0000002-0000-0000-0000-000000000002',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Quantum Questers',
      access_code: 'TEAM-BETA-202',
      score: 0,
      created_at: new Date(Date.now() - 2400000).toISOString()
    },
    {
      id: 'd0000003-0000-0000-0000-000000000003',
      event_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Cyber Cyphers',
      access_code: 'TEAM-GAMMA-303',
      score: 150,
      created_at: new Date(Date.now() - 1200000).toISOString()
    }
  ],
  players: [
    { id: 'e0000001-0000-0000-0000-000000000001', team_id: 'd0000001-0000-0000-0000-000000000001', name: 'Aarav Sharma', ug_year: 'UG1', email: 'aarav@univ.edu' },
    { id: 'e0000002-0000-0000-0000-000000000002', team_id: 'd0000001-0000-0000-0000-000000000001', name: 'Ananya Patel', ug_year: 'UG2', email: 'ananya@univ.edu' },
    { id: 'e0000003-0000-0000-0000-000000000003', team_id: 'd0000002-0000-0000-0000-000000000002', name: 'Rohan Verma', ug_year: 'UG3', email: 'rohan@univ.edu' },
    { id: 'e0000004-0000-0000-0000-000000000004', team_id: 'd0000002-0000-0000-0000-000000000002', name: 'Sneha Reddy', ug_year: 'UG4', email: 'sneha@univ.edu' },
    { id: 'e0000005-0000-0000-0000-000000000005', team_id: 'd0000003-0000-0000-0000-000000000003', name: 'Vikram Joshi', ug_year: 'UG2', email: 'vikram@univ.edu' },
    { id: 'e0000006-0000-0000-0000-000000000006', team_id: 'd0000003-0000-0000-0000-000000000003', name: 'Divya Nair', ug_year: 'UG4', email: 'divya@univ.edu' }
  ],
  team_progress: [
    {
      id: 'f0000001-0000-0000-0000-000000000001',
      team_id: 'd0000001-0000-0000-0000-000000000001',
      current_node_id: 'b0000002-0000-0000-0000-000000000002',
      current_position: 2,
      is_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    },
    {
      id: 'f0000002-0000-0000-0000-000000000002',
      team_id: 'd0000002-0000-0000-0000-000000000002',
      current_node_id: 'b0000001-0000-0000-0000-000000000001',
      current_position: 1,
      is_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    },
    {
      id: 'f0000003-0000-0000-0000-000000000003',
      team_id: 'd0000003-0000-0000-0000-000000000003',
      current_node_id: 'b0000003-0000-0000-0000-000000000003',
      current_position: 3,
      is_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    }
  ],
  submissions: [],
  score_events: [],
  hint_unlocks: []
};

// Flexible Node path validation:
// Any node is NOT compulsory! It is not necessary to have a START or a FINISH node.
// Admins can have any number of nodes and any combination of types (START, QUEST, TREASURE_HUNT, FINISH).
export function validateNodePath(nodes) {
  if (!Array.isArray(nodes)) {
    return { valid: false, error: 'Nodes must be an array.' };
  }

  if (nodes.length === 0) {
    return { valid: true, error: null };
  }

  // Check unique positions
  const positions = nodes.map(n => Number(n.position));
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    return { valid: false, error: 'Node positions must be unique.' };
  }

  // Check valid types if provided
  const validTypes = ['START', 'QUEST', 'TREASURE_HUNT', 'FINISH'];
  for (const node of nodes) {
    if (node.type && !validTypes.includes(node.type)) {
      return { valid: false, error: `Invalid node type: "${node.type}". Allowed types are: ${validTypes.join(', ')}.` };
    }
  }

  return { valid: true, error: null };
}

export const dbService = {
  // EVENTS
  async listEvents() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return localDb.events;
  },

  async getEvent(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    }
    return localDb.events.find(e => e.id === id) || null;
  },

  async createEvent({ title, description, status = 'active', createdBy = null }) {
    const newEvent = {
      id: crypto.randomUUID(),
      title,
      description: description || '',
      status,
      created_by: createdBy,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('events').insert([newEvent]).select().single();
      if (error) throw error;
      return data;
    }

    localDb.events.push(newEvent);
    return newEvent;
  },

  async deleteEvent(eventId) {
    if (isSupabaseConfigured) {
      // Find all teams and nodes under this event
      const { data: teamList } = await supabase.from('teams').select('id').eq('event_id', eventId);
      const teamIds = (teamList || []).map(t => t.id);

      if (teamIds.length > 0) {
        await supabase.from('submissions').delete().in('team_id', teamIds);
        await supabase.from('score_events').delete().in('team_id', teamIds);
        await supabase.from('team_progress').delete().in('team_id', teamIds);
        await supabase.from('hint_unlocks').delete().in('team_id', teamIds);
        await supabase.from('players').delete().in('team_id', teamIds);
        await supabase.from('teams').delete().eq('event_id', eventId);
      }

      const { data: nodeList } = await supabase.from('game_nodes').select('id').eq('event_id', eventId);
      const nodeIds = (nodeList || []).map(n => n.id);

      if (nodeIds.length > 0) {
        await supabase.from('node_hints').delete().in('node_id', nodeIds);
        await supabase.from('game_nodes').delete().eq('event_id', eventId);
      }

      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      return { success: true, message: 'Tournament event deleted successfully.' };
    }

    const teamIds = localDb.teams.filter(t => t.event_id === eventId).map(t => t.id);
    const nodeIds = localDb.game_nodes.filter(n => n.event_id === eventId).map(n => n.id);

    localDb.submissions = localDb.submissions.filter(s => !teamIds.includes(s.team_id));
    localDb.score_events = localDb.score_events.filter(se => !teamIds.includes(se.team_id));
    localDb.team_progress = localDb.team_progress.filter(tp => !teamIds.includes(tp.team_id));
    localDb.hint_unlocks = localDb.hint_unlocks.filter(hu => !teamIds.includes(hu.team_id));
    localDb.players = localDb.players.filter(p => !teamIds.includes(p.team_id));
    localDb.teams = localDb.teams.filter(t => t.event_id !== eventId);
    localDb.node_hints = localDb.node_hints.filter(nh => !nodeIds.includes(nh.node_id));
    localDb.game_nodes = localDb.game_nodes.filter(gn => gn.event_id !== eventId);
    localDb.events = localDb.events.filter(e => e.id !== eventId);

    return { success: true, message: 'Tournament event deleted successfully.' };
  },

  // GAME NODES & PATH
  async getEventPath(eventId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('game_nodes')
        .select('id, event_id, position, type, title, challenge_statement, points, created_at')
        .eq('event_id', eventId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    }

    return localDb.game_nodes
      .filter(n => n.event_id === eventId)
      .sort((a, b) => a.position - b.position)
      .map(n => ({
        id: n.id,
        event_id: n.event_id,
        position: n.position,
        type: n.type,
        title: n.title,
        challenge_statement: n.challenge_statement,
        points: n.points,
        created_at: n.created_at
      }));
  },

  async addNode(eventId, nodeData) {
    const { position, type = 'QUEST', title, challenge_statement, points = 100, expected_answer = '', hints = [] } = nodeData;

    const currentNodes = await this.getEventPath(eventId);
    const candidateNodes = [...currentNodes, { position: Number(position), type, title, challenge_statement, points }];

    const validation = validateNodePath(candidateNodes);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const newNode = {
      id: crypto.randomUUID(),
      event_id: eventId,
      position: Number(position),
      type,
      title,
      challenge_statement,
      points: Number(points),
      expected_answer,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('game_nodes').insert([newNode]).select().single();
      if (error) throw error;

      if (Array.isArray(hints) && hints.length > 0) {
        const hintRecords = hints.map((h, idx) => ({
          id: crypto.randomUUID(),
          node_id: newNode.id,
          hint_number: idx + 1,
          hint_text: h.hint_text,
          debugging_task: h.debugging_task || 'Debug the logic to unlock hint.',
          debugging_answer: h.debugging_answer || 'solved'
        }));
        await supabase.from('node_hints').insert(hintRecords);
      }
      return data;
    }

    localDb.game_nodes.push(newNode);

    if (Array.isArray(hints) && hints.length > 0) {
      hints.forEach((h, idx) => {
        localDb.node_hints.push({
          id: crypto.randomUUID(),
          node_id: newNode.id,
          hint_number: idx + 1,
          hint_text: h.hint_text,
          debugging_task: h.debugging_task || 'Debug the following logic to unlock hint.',
          debugging_answer: h.debugging_answer || 'solved'
        });
      });
    }

    return newNode;
  },

  async updateNode(nodeId, updates) {
    if (isSupabaseConfigured) {
      const { data: current, error: getErr } = await supabase.from('game_nodes').select('*').eq('id', nodeId).single();
      if (getErr || !current) throw new Error('Game node not found.');

      const { data: otherNodes } = await supabase.from('game_nodes').select('*').eq('event_id', current.event_id).neq('id', nodeId);
      const updatedCandidate = { ...current, ...updates };
      if (updates.position) updatedCandidate.position = Number(updates.position);

      const validation = validateNodePath([...(otherNodes || []), updatedCandidate]);
      if (!validation.valid) throw new Error(validation.error);

      const { data, error } = await supabase.from('game_nodes').update(updates).eq('id', nodeId).select().single();
      if (error) throw error;
      return data;
    }

    const current = localDb.game_nodes.find(n => n.id === nodeId);
    if (!current) throw new Error('Game node not found.');

    const otherNodes = localDb.game_nodes.filter(n => n.event_id === current.event_id && n.id !== nodeId);
    const updatedCandidate = { ...current, ...updates };
    if (updates.position) updatedCandidate.position = Number(updates.position);

    const validation = validateNodePath([...otherNodes, updatedCandidate]);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    Object.assign(current, updates);
    return current;
  },

  async deleteNode(nodeId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('game_nodes').delete().eq('id', nodeId);
      if (error) throw error;
      return { success: true };
    }

    const current = localDb.game_nodes.find(n => n.id === nodeId);
    if (!current) throw new Error('Game node not found.');

    const index = localDb.game_nodes.findIndex(n => n.id === nodeId);
    localDb.game_nodes.splice(index, 1);
    return { success: true };
  },

  // TEAMS & PLAYERS
  async listTeams(eventId) {
    if (isSupabaseConfigured) {
      const [teamsRes, progRes, nodes] = await Promise.all([
        supabase.from('teams').select('*, players(*)').eq('event_id', eventId).order('score', { ascending: false }),
        supabase.from('team_progress').select('*'),
        this.getEventPath(eventId)
      ]);
      if (teamsRes.error) throw teamsRes.error;
      const teams = teamsRes.data || [];
      const progressList = progRes.data || [];
      const nodeMap = new Map(nodes.map(n => [n.position, n]));

      return teams.map(t => {
        const prog = progressList.find(p => p.team_id === t.id) || {
          current_position: 1,
          is_completed: false,
          completed_at: null,
          updated_at: t.created_at
        };
        const currNode = nodeMap.get(prog.current_position);
        return {
          ...t,
          progress: prog,
          current_position: prog.current_position,
          is_completed: prog.is_completed,
          completed_at: prog.completed_at,
          current_node_title: currNode ? currNode.title : `Level ${prog.current_position}`,
          current_node_type: currNode ? currNode.type : 'QUEST',
          current_node_points: currNode ? currNode.points : 0,
          current_node_id: currNode ? currNode.id : prog.current_node_id
        };
      });
    }

    const eventNodes = localDb.game_nodes.filter(n => n.event_id === eventId);
    const nodeMap = new Map(eventNodes.map(n => [n.position, n]));

    return localDb.teams
      .filter(t => t.event_id === eventId)
      .map(t => {
        const prog = localDb.team_progress.find(p => p.team_id === t.id) || {
          current_position: 1,
          is_completed: false,
          completed_at: null,
          updated_at: t.created_at
        };
        const currNode = nodeMap.get(prog.current_position);
        return {
          ...t,
          progress: prog,
          current_position: prog.current_position,
          is_completed: prog.is_completed,
          completed_at: prog.completed_at,
          current_node_title: currNode ? currNode.title : `Level ${prog.current_position}`,
          current_node_type: currNode ? currNode.type : 'QUEST',
          current_node_points: currNode ? currNode.points : 0,
          current_node_id: currNode ? currNode.id : prog.current_node_id,
          players: localDb.players.filter(p => p.team_id === t.id)
        };
      });
  },

  async getTeamByAccessCode(accessCode) {
    const code = accessCode.trim().toUpperCase();

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('teams').select('*, players(*)').ilike('access_code', code).maybeSingle();
      if (error || !data) return null;
      return data;
    }

    const team = localDb.teams.find(t => t.access_code.toUpperCase() === code);
    if (!team) return null;
    return {
      ...team,
      players: localDb.players.filter(p => p.team_id === team.id)
    };
  },

  async createTeam(eventId, { name, accessCode, players = [] }) {
    if (!name || !accessCode) {
      throw new Error('Team name and access code are required.');
    }

    const code = accessCode.trim().toUpperCase();

    // Check existing code in Supabase or local
    if (isSupabaseConfigured) {
      const { data: existingCode } = await supabase.from('teams').select('id').eq('access_code', code).maybeSingle();
      if (existingCode) throw new Error('Access code already exists. Please choose a unique access code.');
    } else {
      const existingCode = localDb.teams.find(t => t.access_code === code);
      if (existingCode) throw new Error('Access code already exists. Please choose a unique access code.');
    }

    // Find the initial starting node for this event (first in sorted position sequence)
    const eventNodes = await this.getEventPath(eventId);
    const sortedNodes = [...eventNodes].sort((a, b) => a.position - b.position);
    const firstNode = sortedNodes.length > 0 ? sortedNodes[0] : null;

    const teamId = crypto.randomUUID();
    const newTeam = {
      id: teamId,
      event_id: eventId,
      name: name.trim(),
      access_code: code,
      score: 0,
      created_at: new Date().toISOString()
    };

    const newPlayers = players.map(p => {
      const validYears = ['UG1', 'UG2', 'UG3', 'UG4'];
      const ug_year = validYears.includes(p.ug_year) ? p.ug_year : 'UG1';
      return {
        id: crypto.randomUUID(),
        team_id: teamId,
        name: p.name || 'Contestant',
        ug_year,
        email: p.email || '',
        created_at: new Date().toISOString()
      };
    });

    const newProgress = {
      id: crypto.randomUUID(),
      team_id: teamId,
      current_node_id: firstNode ? firstNode.id : null,
      current_position: firstNode ? firstNode.position : 1,
      is_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data: teamData, error: teamErr } = await supabase.from('teams').insert([newTeam]).select().single();
      if (teamErr) throw teamErr;
      if (newPlayers.length > 0) {
        await supabase.from('players').insert(newPlayers);
      }
      await supabase.from('team_progress').insert([newProgress]);
      return { ...teamData, players: newPlayers };
    }

    localDb.teams.push(newTeam);
    localDb.players.push(...newPlayers);
    localDb.team_progress.push(newProgress);

    return { ...newTeam, players: newPlayers };
  },

  // TEAM GAME & PROGRESSION
  async advanceTeamNode(teamId, { awardPoints = true, customPoints = null } = {}) {
    let team, progress;

    if (isSupabaseConfigured) {
      const { data: t, error: tErr } = await supabase.from('teams').select('*').eq('id', teamId).single();
      if (tErr || !t) throw new Error('Team not found.');
      team = t;

      const { data: p } = await supabase.from('team_progress').select('*').eq('team_id', teamId).maybeSingle();
      progress = p;
    } else {
      team = localDb.teams.find(t => t.id === teamId);
      if (!team) throw new Error('Team not found.');
      progress = localDb.team_progress.find(p => p.team_id === teamId);
    }

    if (!progress) {
      progress = {
        id: crypto.randomUUID(),
        team_id: teamId,
        current_node_id: null,
        current_position: 1,
        is_completed: false,
        completed_at: null,
        updated_at: new Date().toISOString()
      };
      if (isSupabaseConfigured) {
        await supabase.from('team_progress').insert([progress]);
      } else {
        localDb.team_progress.push(progress);
      }
    }

    if (progress.is_completed) {
      return {
        success: false,
        message: `${team.name} has already completed the tournament!`,
        teamId: team.id,
        teamName: team.name,
        isCompleted: true,
        current_position: progress.current_position,
        newScore: team.score,
        pointsAwarded: 0
      };
    }

    const allNodes = await this.getEventPath(team.event_id);
    const sortedNodes = [...allNodes].sort((a, b) => a.position - b.position);

    if (sortedNodes.length === 0) {
      throw new Error('No challenge nodes found in this tournament path.');
    }

    const currentNode = sortedNodes.find(n => n.position === progress.current_position) || sortedNodes[0];
    const nextNode = sortedNodes.find(n => n.position > currentNode.position);

    let pointsAwarded = 0;
    if (awardPoints && currentNode) {
      const pointsToAdd = customPoints !== null ? Number(customPoints) : (currentNode.points || 0);

      let alreadyAwarded = false;
      if (isSupabaseConfigured) {
        const { data: existingScore } = await supabase
          .from('score_events')
          .select('id')
          .eq('team_id', team.id)
          .eq('node_id', currentNode.id)
          .maybeSingle();
        alreadyAwarded = !!existingScore;
      } else {
        alreadyAwarded = localDb.score_events.some(
          se => se.team_id === team.id && se.node_id === currentNode.id
        );
      }

      if (!alreadyAwarded && pointsToAdd > 0) {
        pointsAwarded = pointsToAdd;
        const newScore = team.score + pointsAwarded;

        if (isSupabaseConfigured) {
          await supabase.from('teams').update({ score: newScore }).eq('id', team.id);
          await supabase.from('score_events').insert([{
            id: crypto.randomUUID(),
            team_id: team.id,
            node_id: currentNode.id,
            points: pointsAwarded,
            reason: `Admin Advanced: Passed Level ${currentNode.position} (${currentNode.title})`,
            created_at: new Date().toISOString()
          }]);
        } else {
          localDb.score_events.push({
            id: crypto.randomUUID(),
            team_id: team.id,
            node_id: currentNode.id,
            points: pointsAwarded,
            reason: `Admin Advanced: Passed Level ${currentNode.position} (${currentNode.title})`,
            created_at: new Date().toISOString()
          });
        }
        team.score = newScore;
      }
    }

    let advancedToPosition = progress.current_position;
    let isCompleted = false;
    const nowIso = new Date().toISOString();

    if (nextNode) {
      advancedToPosition = nextNode.position;
      isCompleted = false;

      if (isSupabaseConfigured) {
        await supabase.from('team_progress').update({
          current_node_id: nextNode.id,
          current_position: nextNode.position,
          is_completed: false,
          updated_at: nowIso
        }).eq('team_id', team.id);
      } else {
        progress.current_node_id = nextNode.id;
        progress.current_position = nextNode.position;
        progress.is_completed = false;
        progress.updated_at = nowIso;
      }
    } else {
      // Team passed the final node in the path!
      isCompleted = true;

      if (isSupabaseConfigured) {
        await supabase.from('team_progress').update({
          is_completed: true,
          completed_at: nowIso,
          updated_at: nowIso
        }).eq('team_id', team.id);
      } else {
        progress.is_completed = true;
        progress.completed_at = nowIso;
        progress.updated_at = nowIso;
      }
    }

    return {
      success: true,
      teamId: team.id,
      teamName: team.name,
      previousPosition: currentNode.position,
      advancedToPosition,
      pointsAwarded,
      newScore: team.score,
      isCompleted,
      currentNodeTitle: nextNode ? nextNode.title : `${currentNode.title} (Finished)`,
      currentNodeType: nextNode ? nextNode.type : currentNode.type,
      currentNodePoints: nextNode ? nextNode.points : 0
    };
  },

  async setTeamNode(teamId, targetPosition) {
    const pos = Number(targetPosition);
    if (isNaN(pos) || pos < 1) {
      throw new Error('Valid level position is required.');
    }

    let team, progress;
    if (isSupabaseConfigured) {
      const { data: t, error: tErr } = await supabase.from('teams').select('*').eq('id', teamId).single();
      if (tErr || !t) throw new Error('Team not found.');
      team = t;

      const { data: p } = await supabase.from('team_progress').select('*').eq('team_id', teamId).maybeSingle();
      progress = p;
    } else {
      team = localDb.teams.find(t => t.id === teamId);
      if (!team) throw new Error('Team not found.');
      progress = localDb.team_progress.find(p => p.team_id === teamId);
    }

    const allNodes = await this.getEventPath(team.event_id);
    const sortedNodes = [...allNodes].sort((a, b) => a.position - b.position);
    const targetNode = sortedNodes.find(n => n.position === pos);

    if (!targetNode && sortedNodes.length > 0) {
      throw new Error(`Level position ${pos} does not exist in this tournament path.`);
    }

    const nowIso = new Date().toISOString();
    const isCompleted = sortedNodes.length > 0 && pos > sortedNodes[sortedNodes.length - 1].position;

    if (isSupabaseConfigured) {
      if (progress) {
        await supabase.from('team_progress').update({
          current_node_id: targetNode ? targetNode.id : null,
          current_position: pos,
          is_completed: isCompleted,
          completed_at: isCompleted ? nowIso : null,
          updated_at: nowIso
        }).eq('team_id', team.id);
      } else {
        await supabase.from('team_progress').insert([{
          id: crypto.randomUUID(),
          team_id: team.id,
          current_node_id: targetNode ? targetNode.id : null,
          current_position: pos,
          is_completed: isCompleted,
          completed_at: isCompleted ? nowIso : null,
          updated_at: nowIso
        }]);
      }
    } else {
      if (progress) {
        progress.current_node_id = targetNode ? targetNode.id : null;
        progress.current_position = pos;
        progress.is_completed = isCompleted;
        progress.completed_at = isCompleted ? nowIso : null;
        progress.updated_at = nowIso;
      } else {
        localDb.team_progress.push({
          id: crypto.randomUUID(),
          team_id: team.id,
          current_node_id: targetNode ? targetNode.id : null,
          current_position: pos,
          is_completed: isCompleted,
          completed_at: isCompleted ? nowIso : null,
          updated_at: nowIso
        });
      }
    }

    return {
      success: true,
      teamId: team.id,
      teamName: team.name,
      current_position: pos,
      isCompleted,
      currentNodeTitle: targetNode ? targetNode.title : `Level ${pos}`,
      score: team.score
    };
  },

  async bulkAdvanceTeams(teamIds, { awardPoints = true } = {}) {
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      throw new Error('At least one team must be selected to advance.');
    }

    const results = [];
    for (const id of teamIds) {
      try {
        const res = await this.advanceTeamNode(id, { awardPoints });
        results.push({ teamId: id, success: true, ...res });
      } catch (err) {
        results.push({ teamId: id, success: false, error: err.message });
      }
    }

    return {
      success: true,
      totalRequested: teamIds.length,
      advancedCount: results.filter(r => r.success).length,
      results
    };
  },

  async startGame(eventId, { resetAll = false } = {}) {
    // 1. Set event status to active
    if (isSupabaseConfigured) {
      await supabase.from('events').update({ status: 'active' }).eq('id', eventId);
    } else {
      const ev = localDb.events.find(e => e.id === eventId);
      if (ev) ev.status = 'active';
    }

    // 2. Identify start node
    const nodes = await this.getEventPath(eventId);
    const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
    const startNode = sortedNodes.length > 0 ? sortedNodes[0] : null;
    const startPos = startNode ? startNode.position : 1;
    const nowIso = new Date().toISOString();

    // 3. Ensure all teams have team_progress initialized at start
    let teams = [];
    if (isSupabaseConfigured) {
      const { data: tData } = await supabase.from('teams').select('id, name, score').eq('event_id', eventId);
      teams = tData || [];
      const { data: pData } = await supabase.from('team_progress').select('*');
      const progressMap = new Map((pData || []).map(p => [p.team_id, p]));

      for (const t of teams) {
        const existing = progressMap.get(t.id);
        if (!existing) {
          await supabase.from('team_progress').insert([{
            id: crypto.randomUUID(),
            team_id: t.id,
            current_node_id: startNode ? startNode.id : null,
            current_position: startPos,
            is_completed: false,
            updated_at: nowIso
          }]);
        } else if (resetAll) {
          await supabase.from('team_progress').update({
            current_node_id: startNode ? startNode.id : null,
            current_position: startPos,
            is_completed: false,
            completed_at: null,
            updated_at: nowIso
          }).eq('team_id', t.id);
          await supabase.from('teams').update({ score: 0 }).eq('id', t.id);
        }
      }
    } else {
      teams = localDb.teams.filter(t => t.event_id === eventId);
      for (const t of teams) {
        let p = localDb.team_progress.find(prog => prog.team_id === t.id);
        if (!p) {
          p = {
            id: crypto.randomUUID(),
            team_id: t.id,
            current_node_id: startNode ? startNode.id : null,
            current_position: startPos,
            is_completed: false,
            completed_at: null,
            updated_at: nowIso
          };
          localDb.team_progress.push(p);
        } else if (resetAll) {
          p.current_node_id = startNode ? startNode.id : null;
          p.current_position = startPos;
          p.is_completed = false;
          p.completed_at = null;
          p.updated_at = nowIso;
          t.score = 0;
        }
      }
    }

    return {
      success: true,
      message: `Tournament started! ${teams.length} teams active at Level ${startPos}${startNode ? ` (${startNode.title})` : ''}.`,
      totalTeams: teams.length,
      startPosition: startPos,
      startNodeTitle: startNode ? startNode.title : `Level ${startPos}`
    };
  },

  async seedSampleTeams(eventId, count = 10) {
    const prefixes = ['Quantum', 'Binary', 'Cyber', 'Algorithm', 'Pixel', 'Vector', 'Matrix', 'Syntax', 'Recursive', 'Neural', 'Cloud', 'Hyper', 'Titan', 'Apex', 'Shadow', 'Dynamic', 'Logic', 'Code', 'Byte', 'Stack', 'Nexus', 'Pulse', 'Vertex', 'Sigma', 'Prism'];
    const suffixes = ['Questers', 'Bandits', 'Coders', 'Strikers', 'Wizards', 'Hackers', 'Foundry', 'Legion', 'Knights', 'Pioneers', 'Titans', 'Force', 'Voyagers', 'Squad', 'Devs', 'Warriors', 'Guild', 'Rangers', 'Pioneers', 'Engineers'];

    const numToCreate = Math.min(Math.max(Number(count) || 10, 1), 100);
    const createdTeams = [];

    for (let i = 1; i <= numToCreate; i++) {
      const pIndex = (i - 1) % prefixes.length;
      const sIndex = Math.floor((i - 1) / prefixes.length) % suffixes.length;
      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const name = `${prefixes[pIndex]} ${suffixes[sIndex]} ${randSuffix}`;
      const code = `TEAM-${prefixes[pIndex].substring(0, 3).toUpperCase()}-${randSuffix}-${i}`;

      try {
        const team = await this.createTeam(eventId, {
          name,
          accessCode: code,
          players: [
            { name: `Player ${i}A`, ug_year: `UG${((i - 1) % 4) + 1}`, email: `team${i}a@codequest.org` },
            { name: `Player ${i}B`, ug_year: `UG${(i % 4) + 1}`, email: `team${i}b@codequest.org` }
          ]
        });
        createdTeams.push(team);
      } catch (err) {
        // Skip duplicate code if any
      }
    }

    return {
      success: true,
      createdCount: createdTeams.length,
      teams: createdTeams
    };
  },

  async bulkCreateTeams(eventId, teamList) {
    if (!Array.isArray(teamList) || teamList.length === 0) {
      throw new Error('At least one team must be provided.');
    }
    const createdTeams = [];
    const errors = [];
    for (let i = 0; i < teamList.length; i++) {
      const item = teamList[i];
      let teamObj;
      if (typeof item === 'string') {
        const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const cleanName = item.trim() || `Team ${i + 1}`;
        const prefix = cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'TEAM';
        teamObj = {
          name: cleanName,
          accessCode: `TEAM-${prefix}-${randCode}-${i + 1}`,
          players: [
            { name: `Player 1`, ug_year: 'UG1' },
            { name: `Player 2`, ug_year: 'UG2' }
          ]
        };
      } else {
        teamObj = item;
      }
      try {
        const t = await this.createTeam(eventId, teamObj);
        createdTeams.push(t);
      } catch (err) {
        errors.push({ name: teamObj.name || `Team ${i + 1}`, error: err.message });
      }
    }
    return {
      success: true,
      createdCount: createdTeams.length,
      errorsCount: errors.length,
      createdTeams,
      errors
    };
  },

  // TEAM GAME & PROGRESSION
  async getTeamCurrentNode(teamId) {
    let team, progress;

    if (isSupabaseConfigured) {
      const { data: t, error: tErr } = await supabase.from('teams').select('*').eq('id', teamId).single();
      if (tErr || !t) throw new Error('Team not found.');
      team = t;

      const { data: p } = await supabase.from('team_progress').select('*').eq('team_id', teamId).maybeSingle();
      progress = p || { current_position: 1, is_completed: false };
    } else {
      team = localDb.teams.find(t => t.id === teamId);
      if (!team) throw new Error('Team not found.');

      progress = localDb.team_progress.find(p => p.team_id === teamId) || {
        current_position: 1,
        is_completed: false
      };
    }

    const eventNodes = await this.getEventPath(team.event_id);
    const sortedNodes = [...eventNodes].sort((a, b) => a.position - b.position);
    const currentNode = sortedNodes.find(n => n.position === progress.current_position);

    if (!currentNode) {
      return {
        team,
        progress,
        node: null,
        message: 'No active node found for current position.'
      };
    }

    let hints = [];
    let pendingSubmission = null;

    if (isSupabaseConfigured) {
      const { data: hintsData } = await supabase.from('node_hints').select('*').eq('node_id', currentNode.id);
      const { data: unlocksData } = await supabase.from('hint_unlocks').select('hint_id').eq('team_id', teamId);
      const unlockedSet = new Set((unlocksData || []).map(u => u.hint_id));

      hints = (hintsData || []).map(h => ({
        id: h.id,
        hint_number: h.hint_number,
        debugging_task: h.debugging_task,
        is_unlocked: unlockedSet.has(h.id),
        hint_text: unlockedSet.has(h.id) ? h.hint_text : null
      }));

      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .eq('team_id', teamId)
        .eq('node_id', currentNode.id)
        .eq('status', 'PENDING')
        .maybeSingle();

      pendingSubmission = subData || null;
    } else {
      hints = localDb.node_hints
        .filter(h => h.node_id === currentNode.id)
        .map(h => {
          const isUnlocked = localDb.hint_unlocks.some(u => u.team_id === teamId && u.hint_id === h.id);
          return {
            id: h.id,
            hint_number: h.hint_number,
            debugging_task: h.debugging_task,
            is_unlocked: isUnlocked,
            hint_text: isUnlocked ? h.hint_text : null
          };
        });

      pendingSubmission = localDb.submissions.find(
        s => s.team_id === teamId && s.node_id === currentNode.id && s.status === 'PENDING'
      ) || null;
    }

    return {
      team: {
        id: team.id,
        name: team.name,
        score: team.score,
        event_id: team.event_id
      },
      progress,
      node: {
        id: currentNode.id,
        position: currentNode.position,
        type: currentNode.type,
        title: currentNode.title,
        challenge_statement: currentNode.challenge_statement,
        points: currentNode.points
      },
      hints,
      pendingSubmission
    };
  },

  // SUBMISSIONS & ADMIN REVIEWS
  async submitAnswer(teamId, { content, submittedBy = null }) {
    if (!content || !content.trim()) {
      throw new Error('Submission content cannot be empty.');
    }

    const { team, progress, node, pendingSubmission } = await this.getTeamCurrentNode(teamId);
    if (!node) {
      throw new Error('No active challenge available to submit to.');
    }
    if (progress.is_completed) {
      throw new Error('Contest already completed! No further submissions allowed.');
    }
    if (pendingSubmission) {
      throw new Error('You already have a pending submission under review for this level.');
    }

    const submission = {
      id: crypto.randomUUID(),
      team_id: teamId,
      node_id: node.id,
      submitted_by: submittedBy,
      content: content.trim(),
      status: 'PENDING',
      reviewed_by: null,
      reviewed_at: null,
      review_feedback: '',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('submissions').insert([submission]).select().single();
      if (error) throw error;
      return data;
    }

    localDb.submissions.push(submission);
    return submission;
  },

  async getPendingSubmissions(eventId) {
    if (isSupabaseConfigured) {
      const nodes = await this.getEventPath(eventId);
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      const nodeIds = Array.from(nodeMap.keys());

      if (nodeIds.length === 0) return [];

      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*, teams(name)')
        .eq('status', 'PENDING')
        .in('node_id', nodeIds)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (submissions || []).map(s => {
        const node = nodeMap.get(s.node_id);
        return {
          ...s,
          team_name: s.teams?.name || 'Unknown Team',
          node_title: node ? node.title : 'Level',
          node_type: node ? node.type : 'QUEST',
          node_position: node ? node.position : 0,
          node_points: node ? node.points : 0,
          expected_answer: node ? node.expected_answer : ''
        };
      });
    }

    const eventNodes = localDb.game_nodes.filter(n => n.event_id === eventId);
    const nodeIds = new Set(eventNodes.map(n => n.id));

    return localDb.submissions
      .filter(s => s.status === 'PENDING' && nodeIds.has(s.node_id))
      .map(s => {
        const team = localDb.teams.find(t => t.id === s.team_id);
        const node = localDb.game_nodes.find(n => n.id === s.node_id);
        return {
          ...s,
          team_name: team ? team.name : 'Unknown Team',
          node_title: node ? node.title : 'Unknown Node',
          node_type: node ? node.type : 'QUEST',
          node_position: node ? node.position : 0,
          node_points: node ? node.points : 0,
          expected_answer: node ? node.expected_answer : ''
        };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  async reviewSubmission(submissionId, { status, feedback = '', reviewedBy = null }) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new Error('Review status must be either APPROVED or REJECTED.');
    }

    let submission, team, node, progress;

    if (isSupabaseConfigured) {
      const { data: s, error: sErr } = await supabase.from('submissions').select('*').eq('id', submissionId).single();
      if (sErr || !s) throw new Error('Submission not found.');
      if (s.status !== 'PENDING') throw new Error(`Submission has already been reviewed (${s.status}).`);
      submission = s;

      const { data: t } = await supabase.from('teams').select('*').eq('id', submission.team_id).single();
      team = t;
      const { data: n } = await supabase.from('game_nodes').select('*').eq('id', submission.node_id).single();
      node = n;
      const { data: p } = await supabase.from('team_progress').select('*').eq('team_id', submission.team_id).single();
      progress = p;

      const updatePayload = {
        status,
        review_feedback: feedback,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      };
      await supabase.from('submissions').update(updatePayload).eq('id', submissionId);
      submission = { ...submission, ...updatePayload };

      let pointsAwarded = 0;
      let advancedToPosition = progress ? progress.current_position : 1;

      if (status === 'APPROVED' && team && node) {
        const { data: existingScore } = await supabase
          .from('score_events')
          .select('id')
          .eq('team_id', team.id)
          .eq('node_id', node.id)
          .maybeSingle();

        if (!existingScore) {
          pointsAwarded = node.points;
          await supabase.from('teams').update({ score: team.score + pointsAwarded }).eq('id', team.id);
          team.score += pointsAwarded;

          await supabase.from('score_events').insert([{
            id: crypto.randomUUID(),
            team_id: team.id,
            node_id: node.id,
            submission_id: submission.id,
            points: pointsAwarded,
            reason: `Approved answer for Level ${node.position}: ${node.title}`,
            created_at: new Date().toISOString()
          }]);
        }

        const allNodes = await this.getEventPath(team.event_id);
        const sortedNodes = [...allNodes].sort((a, b) => a.position - b.position);
        const nextNode = sortedNodes.find(n => n.position > node.position);

        if (progress) {
          if (nextNode) {
            advancedToPosition = nextNode.position;
            await supabase.from('team_progress').update({
              current_node_id: nextNode.id,
              current_position: nextNode.position,
              updated_at: new Date().toISOString()
            }).eq('team_id', team.id);
          } else {
            // Completed final node of the path
            await supabase.from('team_progress').update({
              is_completed: true,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }).eq('team_id', team.id);
            progress.is_completed = true;
          }
        }
      }

      return {
        submission,
        pointsAwarded,
        newTeamScore: team ? team.score : 0,
        advancedToPosition,
        isCompleted: progress ? progress.is_completed : false
      };
    }

    // Local DB fallback
    submission = localDb.submissions.find(s => s.id === submissionId);
    if (!submission) throw new Error('Submission not found.');
    if (submission.status !== 'PENDING') throw new Error(`Submission has already been reviewed (${submission.status}).`);

    submission.status = status;
    submission.review_feedback = feedback;
    submission.reviewed_by = reviewedBy;
    submission.reviewed_at = new Date().toISOString();

    team = localDb.teams.find(t => t.id === submission.team_id);
    node = localDb.game_nodes.find(n => n.id === submission.node_id);
    progress = localDb.team_progress.find(p => p.team_id === submission.team_id);

    let pointsAwarded = 0;
    let advancedToPosition = progress ? progress.current_position : 1;

    if (status === 'APPROVED' && team && node) {
      const existingScoreEvent = localDb.score_events.find(
        se => se.team_id === team.id && se.node_id === node.id
      );

      if (!existingScoreEvent) {
        pointsAwarded = node.points;
        team.score += pointsAwarded;

        localDb.score_events.push({
          id: crypto.randomUUID(),
          team_id: team.id,
          node_id: node.id,
          submission_id: submission.id,
          points: pointsAwarded,
          reason: `Approved answer for Level ${node.position}: ${node.title}`,
          created_at: new Date().toISOString()
        });
      }

      const allNodes = localDb.game_nodes
        .filter(n => n.event_id === team.event_id)
        .sort((a, b) => a.position - b.position);

      const nextNode = allNodes.find(n => n.position > node.position);

      if (progress) {
        if (nextNode) {
          progress.current_node_id = nextNode.id;
          progress.current_position = nextNode.position;
          advancedToPosition = nextNode.position;
          progress.updated_at = new Date().toISOString();
        } else {
          progress.is_completed = true;
          progress.completed_at = new Date().toISOString();
          progress.updated_at = new Date().toISOString();
        }
      }
    }

    return {
      submission,
      pointsAwarded,
      newTeamScore: team ? team.score : 0,
      advancedToPosition,
      isCompleted: progress ? progress.is_completed : false
    };
  },

  // HINTS & DEBUGGING TASK
  async unlockHint(teamId, nodeId, debuggingAnswer) {
    if (!debuggingAnswer || !debuggingAnswer.trim()) {
      throw new Error('Debugging answer is required to unlock hint.');
    }

    let hint;
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('node_hints').select('*').eq('node_id', nodeId).maybeSingle();
      hint = data;
    } else {
      hint = localDb.node_hints.find(h => h.node_id === nodeId);
    }

    if (!hint) {
      throw new Error('No hint found for this challenge.');
    }

    const isCorrect = hint.debugging_answer.trim().toLowerCase() === debuggingAnswer.trim().toLowerCase();
    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect debugging answer. Inspect the code snippet and try again.'
      };
    }

    if (isSupabaseConfigured) {
      const { data: existingUnlock } = await supabase
        .from('hint_unlocks')
        .select('id')
        .eq('team_id', teamId)
        .eq('hint_id', hint.id)
        .maybeSingle();

      if (!existingUnlock) {
        await supabase.from('hint_unlocks').insert([{
          id: crypto.randomUUID(),
          team_id: teamId,
          node_id: nodeId,
          hint_id: hint.id,
          unlocked_at: new Date().toISOString()
        }]);
      }
    } else {
      const alreadyUnlocked = localDb.hint_unlocks.find(u => u.team_id === teamId && u.hint_id === hint.id);
      if (!alreadyUnlocked) {
        localDb.hint_unlocks.push({
          id: crypto.randomUUID(),
          team_id: teamId,
          node_id: nodeId,
          hint_id: hint.id,
          unlocked_at: new Date().toISOString()
        });
      }
    }

    return {
      success: true,
      hint_text: hint.hint_text,
      hint_number: hint.hint_number,
      message: 'Debugging task solved! Hint unlocked.'
    };
  },

  async getUnlockedHints(teamId, nodeId) {
    if (isSupabaseConfigured) {
      const { data: unlocks } = await supabase.from('hint_unlocks').select('hint_id').eq('team_id', teamId).eq('node_id', nodeId);
      const hintIds = (unlocks || []).map(u => u.hint_id);
      if (hintIds.length === 0) return [];
      const { data: hints } = await supabase.from('node_hints').select('id, hint_number, hint_text').in('id', hintIds);
      return hints || [];
    }

    const unlocks = localDb.hint_unlocks.filter(u => u.team_id === teamId && u.node_id === nodeId);
    const hintIds = new Set(unlocks.map(u => u.hint_id));
    return localDb.node_hints
      .filter(h => hintIds.has(h.id))
      .map(h => ({
        id: h.id,
        hint_number: h.hint_number,
        hint_text: h.hint_text
      }));
  },

  // LEADERBOARD
  async getLeaderboard(eventId) {
    let teams = [], nodes = [], progressList = [], playersList = [];

    if (isSupabaseConfigured) {
      const [tRes, nRes, pRes, plRes] = await Promise.all([
        supabase.from('teams').select('*').eq('event_id', eventId),
        this.getEventPath(eventId),
        supabase.from('team_progress').select('*'),
        supabase.from('players').select('*')
      ]);

      teams = tRes.data || [];
      nodes = nRes || [];
      progressList = pRes.data || [];
      playersList = plRes.data || [];
    } else {
      teams = localDb.teams.filter(t => t.event_id === eventId);
      nodes = localDb.game_nodes.filter(n => n.event_id === eventId);
      progressList = localDb.team_progress;
      playersList = localDb.players;
    }

    const eventNodes = [...nodes].sort((a, b) => a.position - b.position);
    const totalLevels = eventNodes.length;

    const leaderboard = teams.map(team => {
      const progress = progressList.find(p => p.team_id === team.id) || {
        current_position: 1,
        is_completed: false,
        completed_at: null,
        updated_at: team.created_at
      };

      const currentNode = eventNodes.find(n => n.position === progress.current_position);
      const teamPlayers = playersList.filter(p => p.team_id === team.id);

      return {
        id: team.id,
        name: team.name,
        score: team.score,
        current_position: progress.current_position,
        total_levels: totalLevels,
        current_node_title: currentNode ? currentNode.title : 'Level ' + progress.current_position,
        current_node_type: currentNode ? currentNode.type : 'QUEST',
        is_completed: progress.is_completed,
        completed_at: progress.completed_at,
        updated_at: progress.updated_at,
        players: teamPlayers.map(p => ({ name: p.name, ug_year: p.ug_year }))
      };
    });

    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.is_completed && !b.is_completed) return -1;
      if (!a.is_completed && b.is_completed) return 1;
      return new Date(a.updated_at) - new Date(b.updated_at);
    });

    return leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  }
};
