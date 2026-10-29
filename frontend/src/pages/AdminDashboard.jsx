import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit3, Shield, Users, Trophy, CheckCircle, 
  AlertCircle, RefreshCw, Layers, Flag, Sparkles, Key,
  FastForward, Play, ChevronRight, ChevronLeft, Search,
  SlidersHorizontal, CheckSquare, Square, RotateCcw, LayoutGrid, List,
  Zap, Award, Compass, Gem
} from 'lucide-react';
import { api } from '../services/api';
import GamePath from '../components/GamePath';
import SubmissionReview from '../components/SubmissionReview';

export default function AdminDashboard({ adminKey = 'admin-secret-codequest-2026' }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [pathNodes, setPathNodes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Tab State
  const [activeTab, setActiveTab] = useState('gameControl'); // 'gameControl' | 'path' | 'submissions' | 'teams' | 'events'

  // Live Game Control States (for ~50 teams)
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL'); // 'ALL' | number | 'COMPLETED'
  const [sortField, setSortField] = useState('SCORE_DESC'); // 'SCORE_DESC' | 'POSITION_DESC' | 'POSITION_ASC' | 'NAME_ASC'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [selectedTeamIds, setSelectedTeamIds] = useState(new Set());
  const [advancingTeamIds, setAdvancingTeamIds] = useState(new Set());
  const [startingGame, setStartingGame] = useState(false);
  const [seedingTeams, setSeedingTeams] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkRegisterText, setBulkRegisterText] = useState('');
  const [bulkRegistering, setBulkRegistering] = useState(false);

  // Form states
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  const [nodeForm, setNodeForm] = useState({
    position: 2,
    type: 'QUEST',
    title: '',
    challenge_statement: '',
    points: 100,
    expected_answer: '',
    hint_text: '',
    debugging_task: '',
    debugging_answer: ''
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    accessCode: '',
    player1Name: '',
    player1UG: 'UG1',
    player1Email: '',
    player2Name: '',
    player2UG: 'UG2',
    player2Email: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const eventList = await api.getEvents();
      setEvents(eventList);
      if (eventList.length > 0) {
        const currentEventId = selectedEventId || eventList[0].id;
        setSelectedEventId(currentEventId);

        const [nodes, teamList, subs] = await Promise.all([
          api.getEventPath(currentEventId),
          api.listTeams(currentEventId),
          api.getPendingSubmissions(currentEventId, adminKey)
        ]);

        setPathNodes(nodes);
        setTeams(teamList);
        setPendingSubmissions(subs);
        // Default next position
        setNodeForm(prev => ({ ...prev, position: nodes.length + 1 }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId]);

  // LIVE GAME CONTROLS:
  const handleAdvanceTeam = async (team) => {
    try {
      setAdvancingTeamIds(prev => new Set(prev).add(team.id));
      const result = await api.advanceTeam(team.id, { awardPoints: true }, adminKey);

      if (!result.success && result.message) {
        setMessage({ type: 'error', text: result.message });
        return;
      }

      const pointsMsg = result.pointsAwarded > 0 ? ` (+${result.pointsAwarded} pts awarded!)` : '';
      const destMsg = result.isCompleted ? 'Finished Tournament 🏆' : `Level ${result.advancedToPosition}`;
      setMessage({
        type: 'success',
        text: `⏩ Advanced "${team.name}" to ${destMsg}${pointsMsg} Score: ${result.newScore} pts.`
      });

      // Update team state locally immediately for instant UX
      setTeams(prevTeams => prevTeams.map(t => {
        if (t.id === team.id) {
          return {
            ...t,
            score: result.newScore,
            current_position: result.advancedToPosition,
            is_completed: result.isCompleted,
            current_node_title: result.currentNodeTitle,
            current_node_type: result.currentNodeType || t.current_node_type
          };
        }
        return t;
      }));

      // Background fresh reload
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setAdvancingTeamIds(prev => {
        const next = new Set(prev);
        next.delete(team.id);
        return next;
      });
    }
  };

  const handleSetTeamNode = async (teamId, targetPos) => {
    try {
      setAdvancingTeamIds(prev => new Set(prev).add(teamId));
      const result = await api.setTeamNode(teamId, targetPos, adminKey);
      setMessage({
        type: 'success',
        text: `Set level for "${result.teamName}" to Level ${result.current_position} (${result.currentNodeTitle}).`
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setAdvancingTeamIds(prev => {
        const next = new Set(prev);
        next.delete(teamId);
        return next;
      });
    }
  };

  const handleBulkAdvance = async () => {
    if (selectedTeamIds.size === 0) return;
    const count = selectedTeamIds.size;
    try {
      setBulkLoading(true);
      const res = await api.bulkAdvanceTeams(selectedEventId, Array.from(selectedTeamIds), { awardPoints: true }, adminKey);
      setMessage({
        type: 'success',
        text: `⏩ Successfully advanced ${res.advancedCount} of ${count} selected teams!`
      });
      setSelectedTeamIds(new Set());
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleStartTournament = async (resetAll = false) => {
    if (resetAll && !window.confirm('Are you sure you want to RESET all teams to Level 1 and 0 score?')) {
      return;
    }
    try {
      setStartingGame(true);
      const res = await api.startGame(selectedEventId, { resetAll }, adminKey);
      setMessage({ type: 'success', text: res.message });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setStartingGame(false);
    }
  };

  const handleSeedTeams = async (count = 10) => {
    try {
      setSeedingTeams(true);
      const res = await api.seedSampleTeams(selectedEventId, count, adminKey);
      setMessage({ type: 'success', text: `Generated ${res.createdCount} sample teams!` });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSeedingTeams(false);
    }
  };

  const handleAdvanceAllOnLevel = async (levelPos) => {
    const teamsOnLevel = teams.filter(t => !t.is_completed && t.current_position === Number(levelPos));
    if (teamsOnLevel.length === 0) return;
    if (!window.confirm(`Advance ALL ${teamsOnLevel.length} teams currently on Level ${levelPos} to next level (+Points)?`)) {
      return;
    }
    try {
      setBulkLoading(true);
      const res = await api.bulkAdvanceTeams(selectedEventId, teamsOnLevel.map(t => t.id), { awardPoints: true }, adminKey);
      setMessage({
        type: 'success',
        text: `⏩ Successfully advanced all ${res.advancedCount} teams on Level ${levelPos} to next level!`
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkRegisterTeams = async (e) => {
    e.preventDefault();
    const lines = bulkRegisterText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one team name.' });
      return;
    }
    try {
      setBulkRegistering(true);
      const res = await api.bulkCreateTeams(selectedEventId, lines, adminKey);
      setMessage({
        type: 'success',
        text: `Registered ${res.createdCount} teams in bulk! ${res.errorsCount > 0 ? `(${res.errorsCount} skipped/failed)` : ''}`
      });
      setBulkRegisterText('');
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkRegistering(false);
    }
  };

  const toggleSelectTeam = (teamId) => {
    setSelectedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const toggleSelectAllFiltered = (filtered) => {
    if (selectedTeamIds.size === filtered.length && filtered.length > 0) {
      setSelectedTeamIds(new Set());
    } else {
      setSelectedTeamIds(new Set(filtered.map(t => t.id)));
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle) return;
    try {
      const created = await api.createEvent({
        title: newEventTitle,
        description: newEventDesc
      }, adminKey);
      setMessage({ type: 'success', text: `Event "${created.title}" created successfully!` });
      setNewEventTitle('');
      setNewEventDesc('');
      setSelectedEventId(created.id);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteEvent = async (eventIdToDelete) => {
    const id = eventIdToDelete || selectedEventId;
    if (!id) return;
    const targetEv = events.find(e => e.id === id);
    const title = targetEv ? targetEv.title : 'this tournament';
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete tournament "${title}"?\n\nThis will remove the event, its path nodes, registered teams, submissions, and score history.`)) {
      return;
    }
    try {
      setLoading(true);
      await api.deleteEvent(id, adminKey);
      setMessage({ type: 'success', text: `Tournament "${title}" and all related data was permanently deleted.` });
      const remainingEvents = events.filter(e => e.id !== id);
      setEvents(remainingEvents);
      if (remainingEvents.length > 0) {
        setSelectedEventId(remainingEvents[0].id);
      } else {
        setSelectedEventId('');
        setPathNodes([]);
        setTeams([]);
        setPendingSubmissions([]);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (e) => {
    e.preventDefault();
    try {
      const hints = [];
      if (nodeForm.hint_text) {
        hints.push({
          hint_text: nodeForm.hint_text,
          debugging_task: nodeForm.debugging_task || 'Inspect code and fix syntax bug.',
          debugging_answer: nodeForm.debugging_answer || 'fixed'
        });
      }

      await api.addNode(selectedEventId, {
        position: Number(nodeForm.position),
        type: nodeForm.type,
        title: nodeForm.title,
        challenge_statement: nodeForm.challenge_statement,
        points: Number(nodeForm.points),
        expected_answer: nodeForm.expected_answer,
        hints
      }, adminKey);

      setMessage({ type: 'success', text: `Node "${nodeForm.title}" added to path!` });
      setNodeForm({
        position: pathNodes.length + 2,
        type: 'QUEST',
        title: '',
        challenge_statement: '',
        points: 100,
        expected_answer: '',
        hint_text: '',
        debugging_task: '',
        debugging_answer: ''
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Are you sure you want to delete this level? Path rules will be verified.')) return;
    try {
      await api.deleteNode(nodeId, adminKey);
      setMessage({ type: 'success', text: 'Node deleted successfully.' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const players = [];
      if (teamForm.player1Name) {
        players.push({
          name: teamForm.player1Name,
          ug_year: teamForm.player1UG,
          email: teamForm.player1Email
        });
      }
      if (teamForm.player2Name) {
        players.push({
          name: teamForm.player2Name,
          ug_year: teamForm.player2UG,
          email: teamForm.player2Email
        });
      }

      await api.createTeam(selectedEventId, {
        name: teamForm.name,
        accessCode: teamForm.accessCode,
        players
      }, adminKey);

      setMessage({ type: 'success', text: `Team "${teamForm.name}" registered successfully!` });
      setTeamForm({
        name: '',
        accessCode: '',
        player1Name: '',
        player1UG: 'UG1',
        player1Email: '',
        player2Name: '',
        player2UG: 'UG2',
        player2Email: ''
      });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Node helper
  const sortedNodes = [...pathNodes].sort((a, b) => a.position - b.position);
  const totalLevels = sortedNodes.length;

  // Filter and sort teams for live control
  const filteredTeams = teams.filter(team => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      team.name.toLowerCase().includes(q) || 
      team.access_code.toLowerCase().includes(q) ||
      (team.players && team.players.some(p => p.name.toLowerCase().includes(q)));
    
    if (!matchesSearch) return false;

    if (levelFilter === 'COMPLETED') return team.is_completed;
    if (levelFilter !== 'ALL') return !team.is_completed && team.current_position === Number(levelFilter);
    return true;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (sortField === 'SCORE_DESC') {
      if (b.score !== a.score) return b.score - a.score;
      if (a.is_completed && !b.is_completed) return -1;
      if (!a.is_completed && b.is_completed) return 1;
      return (b.current_position || 1) - (a.current_position || 1);
    }
    if (sortField === 'POSITION_DESC') {
      const posA = a.is_completed ? 9999 : (a.current_position || 1);
      const posB = b.is_completed ? 9999 : (b.current_position || 1);
      if (posB !== posA) return posB - posA;
      return b.score - a.score;
    }
    if (sortField === 'POSITION_ASC') {
      const posA = a.is_completed ? 9999 : (a.current_position || 1);
      const posB = b.is_completed ? 9999 : (b.current_position || 1);
      if (posA !== posB) return posA - posB;
      return b.score - a.score;
    }
    if (sortField === 'NAME_ASC') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Level counts
  const completedCount = teams.filter(t => t.is_completed).length;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={24} style={{ color: '#00e5ff' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
              Gradient CodeQuest <span style={{ color: '#00e5ff' }}>Admin Console</span>
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Live tournament orchestration, level progression, real-time node updates, and team management.
          </p>
        </div>

        {/* Event Selector & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{
              padding: '8px 14px',
              backgroundColor: '#0a1628',
              border: '1px solid #1e3a66',
              borderRadius: '8px',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.status})
              </option>
            ))}
          </select>

          {selectedEventId && (
            <button
              onClick={() => handleDeleteEvent(selectedEventId)}
              title="Delete this tournament event"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} /> Delete Event
            </button>
          )}

          <a
            href="/leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Leaderboard in a new tab"
            style={{
              backgroundColor: '#00284d',
              border: '1px solid #00e5ff',
              color: '#00e5ff',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Trophy size={14} /> Live Leaderboard ↗
          </a>

          <button
            onClick={loadData}
            title="Refresh Data"
            style={{
              backgroundColor: '#0c1b33',
              border: '1px solid #1e3a66',
              color: '#94a3b8',
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`,
            color: message.type === 'error' ? '#fca5a5' : '#6ee7b7',
            fontSize: '14px',
            boxShadow: message.type === 'success' ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
          }}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span style={{ fontWeight: 600 }}>{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', fontSize: '18px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e3a66', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { id: 'gameControl', label: '🎮 Live Game Control', count: teams.length, icon: FastForward, badgeColor: '#00e5ff' },
          { id: 'path', label: 'Level Path & Nodes', count: pathNodes.length, icon: Layers },
          { id: 'submissions', label: 'Pending Submissions', count: pendingSubmissions.length, icon: Flag, badgeColor: '#ef4444' },
          { id: 'teams', label: 'Register & Rosters', count: teams.length, icon: Users },
          { id: 'events', label: 'Event Settings', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                borderBottom: isActive ? '3px solid #00e5ff' : '3px solid transparent',
                color: isActive ? '#00e5ff' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                fontWeight: 700,
                fontSize: '14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    backgroundColor: isActive ? '#00e5ff' : (tab.badgeColor || '#1e3a66'),
                    color: isActive ? '#050b14' : '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE GAME CONTROL (OPTIMIZED FOR ~50 TEAMS)       */}
      {/* ======================================================== */}
      {activeTab === 'gameControl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tournament Overview & Action Header */}
          <div
            style={{
              backgroundColor: '#0c1b33',
              borderRadius: '14px',
              border: '1px solid #1e3a66',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={22} style={{ color: '#00e5ff' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  Live Game Controller ({teams.length} Teams Enrolled)
                </h2>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                Advance teams along the contest path with 1-click. Nodes, points, and leaderboard update automatically.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleStartTournament(false)}
                disabled={startingGame}
                style={{
                  backgroundColor: '#003366',
                  border: '1px solid #00e5ff',
                  color: '#00e5ff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: startingGame ? 'not-allowed' : 'pointer'
                }}
              >
                <Play size={14} /> Start Tournament (Level 1)
              </button>

              <button
                onClick={() => handleStartTournament(true)}
                disabled={startingGame}
                style={{
                  backgroundColor: '#1e1b4b',
                  border: '1px solid #6366f1',
                  color: '#a5b4fc',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Reset all team progress to Level 1 and 0 points"
              >
                <RotateCcw size={14} /> Reset All to Start
              </button>

              <button
                onClick={() => handleSeedTeams(10)}
                disabled={seedingTeams}
                style={{
                  backgroundColor: '#042f2e',
                  border: '1px solid #14b8a6',
                  color: '#5eead4',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: seedingTeams ? 'not-allowed' : 'pointer'
                }}
                title="Quick seed 10 teams for tournament testing"
              >
                <Sparkles size={14} /> +10 Demo Teams
              </button>

              <button
                onClick={() => handleSeedTeams(50)}
                disabled={seedingTeams}
                style={{
                  backgroundColor: '#052e16',
                  border: '1px solid #22c55e',
                  color: '#86efac',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: seedingTeams ? 'not-allowed' : 'pointer'
                }}
                title="Seed 50 teams at once for full 50-team championship testing"
              >
                <Sparkles size={14} /> +50 Teams (50-Squad Test)
              </button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Teams</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>{teams.length}</div>
            </div>

            <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Levels in Path</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{totalLevels} Nodes</div>
            </div>

            <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Tournament Completed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {completedCount} <span style={{ fontSize: '13px', color: '#94a3b8' }}>({teams.length > 0 ? Math.round((completedCount / teams.length) * 100) : 0}%)</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Points Distributed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
                {teams.reduce((sum, t) => sum + (t.score || 0), 0)} pts
              </div>
            </div>
          </div>

          {/* Filtering, Search & View Controls Bar */}
          <div
            style={{
              backgroundColor: '#0a1628',
              borderRadius: '12px',
              border: '1px solid #1e3a66',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search 50 teams by name, access code, or player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    backgroundColor: '#050b14',
                    border: '1px solid #1e3a66',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Sort by */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Sort:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#050b14',
                    border: '1px solid #1e3a66',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <option value="SCORE_DESC">Rank / Points (High to Low)</option>
                  <option value="POSITION_DESC">Furthest Level First</option>
                  <option value="POSITION_ASC">Lowest Level First</option>
                  <option value="NAME_ASC">Team Name (A-Z)</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div style={{ display: 'flex', backgroundColor: '#050b14', borderRadius: '8px', border: '1px solid #1e3a66', padding: '2px' }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    backgroundColor: viewMode === 'table' ? '#1e3a66' : 'transparent',
                    border: 'none',
                    color: viewMode === 'table' ? '#00e5ff' : '#64748b',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <List size={14} /> Dense Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{
                    backgroundColor: viewMode === 'cards' ? '#1e3a66' : 'transparent',
                    border: 'none',
                    color: viewMode === 'cards' ? '#00e5ff' : '#64748b',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <LayoutGrid size={14} /> Cards
                </button>
              </div>
            </div>

            {/* Level Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>Filter Level:</span>
              <button
                onClick={() => setLevelFilter('ALL')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: levelFilter === 'ALL' ? '1px solid #00e5ff' : '1px solid #1e3a66',
                  backgroundColor: levelFilter === 'ALL' ? '#00284d' : '#050b14',
                  color: levelFilter === 'ALL' ? '#00e5ff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                All ({teams.length})
              </button>

              {sortedNodes.map(node => {
                const count = teams.filter(t => !t.is_completed && t.current_position === node.position).length;
                const isSelected = levelFilter === node.position;
                return (
                  <button
                    key={node.id}
                    onClick={() => setLevelFilter(node.position)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid #1e3a66',
                      backgroundColor: isSelected ? '#0369a1' : '#050b14',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>Pos {node.position}: {node.title}</span>
                    <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => setLevelFilter('COMPLETED')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: levelFilter === 'COMPLETED' ? '1px solid #10b981' : '1px solid #1e3a66',
                  backgroundColor: levelFilter === 'COMPLETED' ? '#064e3b' : '#050b14',
                  color: levelFilter === 'COMPLETED' ? '#6ee7b7' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>🏆 Completed</span>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
                  {completedCount}
                </span>
              </button>

              {typeof levelFilter === 'number' && teams.filter(t => !t.is_completed && t.current_position === levelFilter).length > 0 && (
                <button
                  onClick={() => handleAdvanceAllOnLevel(levelFilter)}
                  disabled={bulkLoading}
                  style={{
                    marginLeft: 'auto',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: '1px solid #38bdf8',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <FastForward size={14} />
                  Advance ALL {teams.filter(t => !t.is_completed && t.current_position === levelFilter).length} Teams on Level {levelFilter} to Next ⏩
                </button>
              )}
            </div>
          </div>

          {/* Bulk Selection Floating Action Bar */}
          {selectedTeamIds.size > 0 && (
            <div
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                <CheckSquare size={18} />
                <span>{selectedTeamIds.size} team(s) selected</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleBulkAdvance}
                  disabled={bulkLoading}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0284c7',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FastForward size={14} /> Advance Selected to Next Level (+Pts) ⏩
                </button>
                <button
                  onClick={() => setSelectedTeamIds(new Set())}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* TEAMS DISPLAY - TABLE VIEW (OPTIMIZED FOR 50 TEAMS) */}
          {viewMode === 'table' ? (
            <div style={{ backgroundColor: '#0a1628', borderRadius: '12px', border: '1px solid #1e3a66', overflowX: 'auto', maxHeight: '740px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ backgroundColor: '#050b14', borderBottom: '2px solid #1e3a66', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.size > 0 && selectedTeamIds.size === sortedTeams.length}
                        onChange={() => toggleSelectAllFiltered(sortedTeams)}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '12px 14px' }}>Rank & Team</th>
                    <th style={{ padding: '12px 14px' }}>Access Code</th>
                    <th style={{ padding: '12px 14px' }}>Score</th>
                    <th style={{ padding: '12px 14px' }}>Current Level Node</th>
                    <th style={{ padding: '12px 14px' }}>Progress</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Admin Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((team, index) => {
                    const isAdvancing = advancingTeamIds.has(team.id);
                    const isSelected = selectedTeamIds.has(team.id);
                    const currNode = sortedNodes.find(n => n.position === team.current_position) || sortedNodes[0];
                    const nextNode = sortedNodes.find(n => n.position > (currNode ? currNode.position : 0));
                    const pointsForCurrent = currNode ? currNode.points : 0;
                    const progressPercent = Math.min(Math.round(((team.is_completed ? totalLevels : team.current_position) / (totalLevels || 1)) * 100), 100);

                    return (
                      <tr
                        key={team.id}
                        style={{
                          borderBottom: '1px solid #1e3a66',
                          backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.05)' : (index % 2 === 0 ? '#0a1628' : '#071224'),
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '12px 14px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTeam(team.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>

                        {/* Rank & Team Name */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                backgroundColor: index < 3 ? '#fbbf24' : '#1e3a66',
                                color: index < 3 ? '#000000' : '#ffffff',
                                fontWeight: 800,
                                fontSize: '11px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{team.name}</div>
                              {team.players && team.players.length > 0 && (
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {team.players.map(p => `${p.name} (${p.ug_year})`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Access Code */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
                            {team.access_code}
                          </span>
                        </td>

                        {/* Score */}
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              backgroundColor: '#00284d',
                              color: '#00e5ff',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '13px'
                            }}
                          >
                            {team.score || 0} pts
                          </span>
                        </td>

                        {/* Current Level Node */}
                        <td style={{ padding: '12px 14px' }}>
                          {team.is_completed ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                🏆 COMPLETED
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  backgroundColor: '#1e3a66',
                                  color: '#38bdf8',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}
                              >
                                Pos {team.current_position || 1}
                              </span>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                                  {team.current_node_title || (currNode ? currNode.title : `Level ${team.current_position}`)}
                                </div>
                                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                                  Worth +{pointsForCurrent} pts
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Progress Bar */}
                        <td style={{ padding: '12px 14px', minWidth: '130px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#050b14', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${progressPercent}%`,
                                  height: '100%',
                                  backgroundColor: team.is_completed ? '#10b981' : '#00e5ff',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                              {team.is_completed ? `${totalLevels}/${totalLevels}` : `${team.current_position}/${totalLevels}`}
                            </span>
                          </div>
                        </td>

                        {/* One-Click Next Action Buttons */}
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            
                            {/* PREVIOUS LEVEL (UNDO / CORRECTION) */}
                            {team.current_position > 1 && !team.is_completed && (
                              <button
                                onClick={() => handleSetTeamNode(team.id, team.current_position - 1)}
                                title="Move back to previous level"
                                disabled={isAdvancing}
                                style={{
                                  backgroundColor: '#050b14',
                                  border: '1px solid #1e3a66',
                                  color: '#94a3b8',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <ChevronLeft size={14} />
                              </button>
                            )}

                            {/* CORE ACTION: NEXT LEVEL BUTTON */}
                            {team.is_completed ? (
                              <button
                                onClick={() => handleSetTeamNode(team.id, totalLevels > 0 ? totalLevels : 1)}
                                style={{
                                  backgroundColor: '#064e3b',
                                  border: '1px solid #10b981',
                                  color: '#6ee7b7',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <CheckCircle size={14} /> Finished
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAdvanceTeam(team)}
                                disabled={isAdvancing}
                                style={{
                                  backgroundColor: '#00284d',
                                  border: '1px solid #00e5ff',
                                  color: '#00e5ff',
                                  padding: '7px 14px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  cursor: isAdvancing ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 0 10px rgba(0, 229, 255, 0.25)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {isAdvancing ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <>
                                    <span>{nextNode ? 'Next Level ⏩' : 'Finish 🏆'}</span>
                                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 800 }}>
                                      +{pointsForCurrent} pts
                                    </span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* LEVEL JUMP DROPDOWN */}
                            <select
                              value={team.is_completed ? 'COMPLETED' : team.current_position}
                              onChange={(e) => {
                                if (e.target.value !== 'COMPLETED') {
                                  handleSetTeamNode(team.id, e.target.value);
                                }
                              }}
                              style={{
                                padding: '5px 8px',
                                backgroundColor: '#050b14',
                                border: '1px solid #1e3a66',
                                borderRadius: '6px',
                                color: '#64748b',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              {sortedNodes.map(n => (
                                <option key={n.id} value={n.position}>
                                  Lvl {n.position}
                                </option>
                              ))}
                            </select>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {sortedTeams.length === 0 && (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No teams found matching search or filter criteria.
                </div>
              )}
            </div>
          ) : (
            /* CARDS VIEW */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {sortedTeams.map((team, index) => {
                const isAdvancing = advancingTeamIds.has(team.id);
                const isSelected = selectedTeamIds.has(team.id);
                const currNode = sortedNodes.find(n => n.position === team.current_position) || sortedNodes[0];
                const nextNode = sortedNodes.find(n => n.position > (currNode ? currNode.position : 0));
                const pointsForCurrent = currNode ? currNode.points : 0;
                const progressPercent = Math.min(Math.round(((team.is_completed ? totalLevels : team.current_position) / (totalLevels || 1)) * 100), 100);

                return (
                  <div
                    key={team.id}
                    style={{
                      backgroundColor: '#0a1628',
                      borderRadius: '12px',
                      border: isSelected ? '1px solid #00e5ff' : '1px solid #1e3a66',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 0 15px rgba(0, 229, 255, 0.15)' : 'none'
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTeam(team.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span
                            style={{
                              backgroundColor: index < 3 ? '#fbbf24' : '#1e3a66',
                              color: index < 3 ? '#000000' : '#ffffff',
                              fontWeight: 800,
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            #{index + 1}
                          </span>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                            {team.name}
                          </h4>
                        </div>

                        <span style={{ backgroundColor: '#00284d', color: '#00e5ff', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '13px' }}>
                          {team.score || 0} pts
                        </span>
                      </div>

                      {/* Access code & players */}
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
                        Code: <strong style={{ color: '#fbbf24' }}>{team.access_code}</strong>
                      </div>

                      {team.players && team.players.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {team.players.map(p => (
                            <span
                              key={p.id || p.name}
                              style={{
                                fontSize: '10px',
                                backgroundColor: '#050b14',
                                color: '#94a3b8',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #1e3a66'
                              }}
                            >
                              {p.name} ({p.ug_year})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Current Node Status */}
                      <div style={{ backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                            Current Level
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
                            +{pointsForCurrent} pts on pass
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ backgroundColor: '#1e3a66', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                            Pos {team.current_position || 1}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            {team.is_completed ? '🏆 Final Milestone Cleared' : (team.current_node_title || (currNode ? currNode.title : `Level ${team.current_position}`))}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{ marginTop: '8px', height: '4px', backgroundColor: '#0a1628', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: team.is_completed ? '#10b981' : '#00e5ff' }} />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      {team.is_completed ? (
                        <div style={{ width: '100%', textAlign: 'center', padding: '8px', backgroundColor: '#064e3b', color: '#34d399', borderRadius: '6px', fontWeight: 700, fontSize: '12px' }}>
                          ✅ Tournament Completed
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAdvanceTeam(team)}
                          disabled={isAdvancing}
                          style={{
                            flex: 1,
                            backgroundColor: '#00284d',
                            border: '1px solid #00e5ff',
                            color: '#00e5ff',
                            padding: '10px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: isAdvancing ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isAdvancing ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <>
                              <span>{nextNode ? 'Next Level ⏩' : 'Finish Tournament 🏆'}</span>
                              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                                (+{pointsForCurrent} pts)
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LEVEL PATH & NODES TOPOLOGY                       */}
      {/* ======================================================== */}
      {activeTab === 'path' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Path Preview */}
          <div style={{ backgroundColor: '#0c1b33', padding: '20px', borderRadius: '12px', border: '1px solid #1e3a66' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#f8fafc' }}>
              Live Contest Path Topology
            </h3>
            <GamePath nodes={pathNodes} currentPosition={pathNodes.length + 1} />
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span>◼ <strong>START:</strong> Square</span>
              <span>● <strong>QUEST:</strong> Circle</span>
              <span>◆ <strong>TREASURE_HUNT:</strong> Diamond</span>
              <span>◼ <strong>FINISH:</strong> Square (Dashed Gold)</span>
              <span style={{ color: '#00e5ff' }}>✨ All nodes are optional — customize any sequence and quantity!</span>
            </div>
          </div>

          {/* Add / Edit Node Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div style={{ backgroundColor: '#0a1628', padding: '20px', borderRadius: '12px', border: '1px solid #1e3a66' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> Add Node to Path
              </h3>

              <form onSubmit={handleAddNode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Position</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={nodeForm.position}
                      onChange={(e) => setNodeForm({ ...nodeForm, position: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Node Type</label>
                    <select
                      value={nodeForm.type}
                      onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value })}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                    >
                      <option value="QUEST">QUEST (Circle)</option>
                      <option value="TREASURE_HUNT">TREASURE_HUNT (Diamond)</option>
                      <option value="START">START (Square)</option>
                      <option value="FINISH">FINISH (Square)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Display Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dynamic Maze"
                    value={nodeForm.title}
                    onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Point Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={nodeForm.points}
                    onChange={(e) => setNodeForm({ ...nodeForm, points: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Challenge Statement</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Enter challenge description, problem statement, or code specification..."
                    value={nodeForm.challenge_statement}
                    onChange={(e) => setNodeForm({ ...nodeForm, challenge_statement: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#fbbf24', display: 'block', marginBottom: '4px' }}>Expected Answer (For Admin Reference)</label>
                  <input
                    type="text"
                    placeholder="Correct solution key or value..."
                    value={nodeForm.expected_answer}
                    onChange={(e) => setNodeForm({ ...nodeForm, expected_answer: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                  />
                </div>

                {/* Hint & Debugging Task */}
                <div style={{ backgroundColor: '#071224', padding: '12px', borderRadius: '8px', border: '1px dashed #1e3a66' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                    Challenge Hint & Separate Debugging Task
                  </div>
                  <input
                    type="text"
                    placeholder="Hint text (unlocked after debugging task)..."
                    value={nodeForm.hint_text}
                    onChange={(e) => setNodeForm({ ...nodeForm, hint_text: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff', fontSize: '12px', marginBottom: '6px' }}
                  />
                  <input
                    type="text"
                    placeholder="Debugging question (e.g., Fix snippet bug: x.lenght)..."
                    value={nodeForm.debugging_task}
                    onChange={(e) => setNodeForm({ ...nodeForm, debugging_task: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff', fontSize: '12px', marginBottom: '6px' }}
                  />
                  <input
                    type="text"
                    placeholder="Debugging task solution answer (e.g. length)..."
                    value={nodeForm.debugging_answer}
                    onChange={(e) => setNodeForm({ ...nodeForm, debugging_answer: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#00284d',
                    border: '1px solid #00e5ff',
                    color: '#00e5ff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    marginTop: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Save Node to Path
                </button>
              </form>
            </div>

            {/* Existing Nodes List */}
            <div style={{ backgroundColor: '#0a1628', padding: '20px', borderRadius: '12px', border: '1px solid #1e3a66' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#f8fafc' }}>
                Existing Path Nodes ({pathNodes.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                {pathNodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      backgroundColor: '#050b14',
                      border: '1px solid #1e3a66',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ backgroundColor: '#1e3a66', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          Pos {node.position}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>
                          {node.type}
                        </span>
                        <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{node.title}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Points: <span style={{ color: '#10b981', fontWeight: 600 }}>+{node.points}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      title="Delete Node"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PENDING SUBMISSIONS REVIEW                        */}
      {/* ======================================================== */}
      {activeTab === 'submissions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              Pending Contest Submissions ({pendingSubmissions.length})
            </h3>
            <button
              onClick={loadData}
              style={{
                backgroundColor: '#0c1b33',
                border: '1px solid #1e3a66',
                color: '#38bdf8',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Refresh Submissions
            </button>
          </div>

          <SubmissionReview
            submissions={pendingSubmissions}
            adminKey={adminKey}
            onReviewed={loadData}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TEAMS & PLAYERS REGISTRATION                      */}
      {/* ======================================================== */}
      {activeTab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Register Team Form */}
          <div style={{ backgroundColor: '#0a1628', padding: '20px', borderRadius: '12px', border: '1px solid #1e3a66' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} /> Register Team & Players
            </h3>

            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Syntax Strikers"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Unique Team Access Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEAM-CODE-505"
                  value={teamForm.accessCode}
                  onChange={(e) => setTeamForm({ ...teamForm, accessCode: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff', textTransform: 'uppercase' }}
                />
              </div>

              {/* Player 1 */}
              <div style={{ backgroundColor: '#071224', padding: '12px', borderRadius: '8px', border: '1px solid #1e3a66' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  Player 1 (Team Leader)
                </div>
                <input
                  type="text"
                  required
                  placeholder="Player 1 Name"
                  value={teamForm.player1Name}
                  onChange={(e) => setTeamForm({ ...teamForm, player1Name: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff', marginBottom: '6px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    value={teamForm.player1UG}
                    onChange={(e) => setTeamForm({ ...teamForm, player1UG: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="UG1">UG1 (1st Year)</option>
                    <option value="UG2">UG2 (2nd Year)</option>
                    <option value="UG3">UG3 (3rd Year)</option>
                    <option value="UG4">UG4 (4th Year)</option>
                  </select>
                  <input
                    type="email"
                    placeholder="Email"
                    value={teamForm.player1Email}
                    onChange={(e) => setTeamForm({ ...teamForm, player1Email: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Player 2 */}
              <div style={{ backgroundColor: '#071224', padding: '12px', borderRadius: '8px', border: '1px solid #1e3a66' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  Player 2
                </div>
                <input
                  type="text"
                  placeholder="Player 2 Name"
                  value={teamForm.player2Name}
                  onChange={(e) => setTeamForm({ ...teamForm, player2Name: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff', marginBottom: '6px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    value={teamForm.player2UG}
                    onChange={(e) => setTeamForm({ ...teamForm, player2UG: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="UG1">UG1 (1st Year)</option>
                    <option value="UG2">UG2 (2nd Year)</option>
                    <option value="UG3">UG3 (3rd Year)</option>
                    <option value="UG4">UG4 (4th Year)</option>
                  </select>
                  <input
                    type="email"
                    placeholder="Email"
                    value={teamForm.player2Email}
                    onChange={(e) => setTeamForm({ ...teamForm, player2Email: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#00284d',
                  border: '1px solid #00e5ff',
                  color: '#00e5ff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  marginTop: '8px',
                  cursor: 'pointer'
                }}
              >
                Register Team
              </button>
            </form>

            {/* Quick Bulk Register Section */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1e3a66' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Sparkles size={14} /> Quick Bulk Register (Up to 50 Teams)
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const sample50 = Array.from({ length: 50 }, (_, i) => `Team CodeQuest ${i + 1}`).join('\n');
                    setBulkRegisterText(sample50);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #1e3a66',
                    color: '#94a3b8',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Fill 50 Sample Names
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                Enter team names (one per line). Access codes and rosters will be automatically generated.
              </p>
              <form onSubmit={handleBulkRegisterTeams}>
                <textarea
                  rows={4}
                  placeholder={`Team Phoenix\nTeam Alpha\nTeam Matrix\n...`}
                  value={bulkRegisterText}
                  onChange={(e) => setBulkRegisterText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#050b14',
                    border: '1px solid #1e3a66',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="submit"
                  disabled={bulkRegistering}
                  style={{
                    width: '100%',
                    backgroundColor: '#064e3b',
                    border: '1px solid #10b981',
                    color: '#6ee7b7',
                    padding: '9px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    marginTop: '8px',
                    cursor: bulkRegistering ? 'not-allowed' : 'pointer'
                  }}
                >
                  {bulkRegistering ? 'Registering Teams...' : '⚡ Bulk Register Teams'}
                </button>
              </form>
            </div>
          </div>

          {/* Teams Roster */}
          <div style={{ backgroundColor: '#0a1628', padding: '20px', borderRadius: '12px', border: '1px solid #1e3a66' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Enrolled Teams ({teams.length})
              </h3>
              <button
                onClick={() => setActiveTab('gameControl')}
                style={{
                  backgroundColor: '#00284d',
                  border: '1px solid #00e5ff',
                  color: '#00e5ff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Go to Live Game Control ⏩
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
              {teams.map(t => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: '#050b14',
                    border: '1px solid #1e3a66',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>{t.name}</h4>
                    <span style={{ backgroundColor: '#00284d', color: '#00e5ff', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                      {t.score || 0} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
                    Access Code: <strong style={{ color: '#fbbf24' }}>{t.access_code}</strong>
                  </div>
                  {t.players && t.players.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {t.players.map(p => (
                        <span
                          key={p.id || p.name}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#112546',
                            color: '#94a3b8',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          {p.name} ({p.ug_year})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: EVENT SETTINGS                                    */}
      {/* ======================================================== */}
      {activeTab === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Create Event Card */}
          <div style={{ backgroundColor: '#0a1628', padding: '24px', borderRadius: '12px', border: '1px solid #1e3a66' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#00e5ff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Create New Contest Event
            </h3>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Event Name / Tournament Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CodeQuest Winter 2026"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Tournament guidelines and rules..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#050b14', border: '1px solid #1e3a66', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: '#00284d',
                  border: '1px solid #00e5ff',
                  color: '#00e5ff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  marginTop: '8px',
                  cursor: 'pointer'
                }}
              >
                Initialize Event
              </button>
            </form>
          </div>

          {/* Existing Events & Deletion Management */}
          <div style={{ backgroundColor: '#0a1628', padding: '24px', borderRadius: '12px', border: '1px solid #1e3a66' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} /> Existing Tournament Events ({events.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map(ev => {
                const isSelected = ev.id === selectedEventId;
                return (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: '#050b14',
                      border: isSelected ? '1px solid #00e5ff' : '1px solid #1e3a66',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
                          {ev.title}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: '10px', backgroundColor: '#00284d', color: '#00e5ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            ACTIVE
                          </span>
                        )}
                        <span style={{ fontSize: '10px', backgroundColor: '#1e3a66', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px' }}>
                          {ev.status}
                        </span>
                      </div>
                      {ev.description && (
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          {ev.description}
                        </p>
                      )}
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', fontFamily: 'monospace' }}>
                        ID: {ev.id}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!isSelected && (
                        <button
                          onClick={() => setSelectedEventId(ev.id)}
                          style={{
                            backgroundColor: '#00284d',
                            border: '1px solid #00e5ff',
                            color: '#00e5ff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Select
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        title={`Delete event "${ev.title}"`}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #ef4444',
                          color: '#fca5a5',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
