import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Users, Award, Zap, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import GamePath from '../components/GamePath';
import TeamCard from '../components/TeamCard';

export default function Leaderboard() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [pathNodes, setPathNodes] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = async () => {
    try {
      const eventList = await api.getEvents();
      setEvents(eventList);
      if (eventList.length > 0) {
        const validEvent = eventList.find(e => e.id === selectedEventId) || eventList[0];
        const eventId = validEvent.id;
        if (eventId !== selectedEventId) {
          setSelectedEventId(eventId);
        }

        const [board, path] = await Promise.all([
          api.getLeaderboard(eventId),
          api.getEventPath(eventId)
        ]);

        setLeaderboard(board);
        setPathNodes(path);
        setLastUpdated(new Date());
      } else {
        setSelectedEventId('');
        setLeaderboard([]);
        setPathNodes([]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEventId]);

  // Fast auto-refresh interval (3 seconds) for real-time tournament standings
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedEventId]);

  // Compute distribution of teams across node positions
  const teamsDistribution = leaderboard.reduce((acc, team) => {
    const pos = team.current_position || 1;
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {});

  const completedCount = leaderboard.filter(t => t.is_completed).length;
  const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Banner & Stats */}
      <div
        style={{
          backgroundColor: '#0c1b33',
          borderRadius: '16px',
          border: '1px solid #1e3a66',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={28} style={{ color: '#fbbf24' }} />
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc' }}>
              Gradient CodeQuest <span style={{ color: '#00e5ff' }}>Championship Arena</span>
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Live tournament standings and team progression path.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#050b14',
              border: '1px solid #1e3a66',
              borderRadius: '8px',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              backgroundColor: autoRefresh ? 'rgba(0, 229, 255, 0.15)' : '#071224',
              border: `1px solid ${autoRefresh ? '#00e5ff' : '#1e3a66'}`,
              color: autoRefresh ? '#00e5ff' : '#64748b',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {autoRefresh ? '● Live (3s)' : 'Paused'}
          </button>

          <button
            onClick={loadData}
            style={{
              backgroundColor: '#00284d',
              border: '1px solid #00e5ff',
              color: '#00e5ff',
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Teams</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>{leaderboard.length}</div>
        </div>

        <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Championship Leader</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {leaderboard[0] ? leaderboard[0].name : 'N/A'}
          </div>
        </div>

        <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Top Score</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#00e5ff', marginTop: '4px' }}>{topScore} pts</div>
        </div>

        <div style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a66', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Completed Tournament</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{completedCount}</div>
        </div>
      </div>

      {/* Global Event Path Topology with Team Density Indicators */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Shared Event Path & Team Positions
          </h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <GamePath
          nodes={pathNodes}
          currentPosition={pathNodes.length}
          teamsDistribution={teamsDistribution}
        />
      </div>

      {/* Ranked Team Cards */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '16px' }}>
          Ranked Standings
        </h2>

        {leaderboard.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#0a1628', borderRadius: '12px', color: '#64748b' }}>
            No registered teams found for this tournament yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaderboard.map((team) => (
              <TeamCard key={team.id} team={team} rank={team.rank} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
