import React, { useState, useEffect } from 'react';
import { 
  Key, Award, Send, CheckCircle, AlertCircle, HelpCircle, 
  Clock, Lock, Zap, RefreshCw, Terminal, Check, LogOut 
} from 'lucide-react';
import { api } from '../services/api';
import GamePath from '../components/GamePath';

export default function TeamGame({ defaultTeamCode = 'TEAM-ALPHA-101' }) {
  const [accessCode, setAccessCode] = useState(defaultTeamCode);
  const [team, setTeam] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [eventPath, setEventPath] = useState([]);
  const [submissionContent, setSubmissionContent] = useState('');
  const [debuggingInputs, setDebuggingInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Login via Access Code
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const loggedTeam = await api.teamLogin(accessCode.trim());
      setTeam(loggedTeam);
      await loadTeamData(loggedTeam.id, loggedTeam.event_id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const prevPosRef = React.useRef(null);
  const prevScoreRef = React.useRef(null);

  const loadTeamData = async (teamId, eventId, isBackground = false) => {
    try {
      const [currentData, path] = await Promise.all([
        api.getTeamCurrentNode(teamId),
        api.getEventPath(eventId)
      ]);

      // Detect advancement / score boost
      const newPos = currentData?.progress?.current_position;
      const newScore = currentData?.team?.score;
      const isComp = currentData?.progress?.is_completed;

      if (prevPosRef.current !== null && newPos && newPos > prevPosRef.current) {
        setMessage({
          type: 'success',
          text: `🚀 Level Cleared! You advanced to Level ${newPos}: "${currentData?.node?.title || ''}"! New score: ${newScore} pts.`
        });
      } else if (prevScoreRef.current !== null && newScore > prevScoreRef.current) {
        setMessage({
          type: 'success',
          text: `⭐ Points Awarded! Your score updated to ${newScore} pts (+${newScore - prevScoreRef.current} pts).`
        });
      }

      if (newPos) prevPosRef.current = newPos;
      if (newScore !== undefined) prevScoreRef.current = newScore;

      setGameData(currentData);
      setEventPath(path);
    } catch (err) {
      if (!isBackground) {
        setMessage({ type: 'error', text: err.message });
      }
    }
  };

  useEffect(() => {
    // Attempt auto-login with default demo code
    if (defaultTeamCode) {
      handleLogin();
    }
  }, []);

  // Real-time live polling so admin "Next" actions reflect instantly on team screen
  useEffect(() => {
    if (!team) return;
    const interval = setInterval(() => {
      loadTeamData(team.id, team.event_id, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [team]);

  // Submit Answer / Code
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!submissionContent.trim() || !team) return;

    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.submitAnswer(team.id, submissionContent);
      setMessage({ 
        type: 'success', 
        text: 'Solution submitted! Waiting for Admin evaluation.' 
      });
      setSubmissionContent('');
      await loadTeamData(team.id, team.event_id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Solve debugging task to unlock hint
  const handleUnlockHint = async (hintId, nodeId) => {
    const debugAnswer = debuggingInputs[hintId] || '';
    if (!debugAnswer.trim()) {
      setMessage({ type: 'error', text: 'Please enter an answer for the debugging task.' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await api.unlockHint(team.id, nodeId, debugAnswer);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadTeamData(team.id, team.event_id);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Login Screen if not logged in
  if (!team) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '32px 24px', backgroundColor: '#0c1b33', borderRadius: '16px', border: '1px solid #1e3a66', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', borderRadius: '12px', backgroundColor: '#00284d', border: '1px solid #00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={24} style={{ color: '#00e5ff' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
            Team Access Gate
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Enter your team access code to enter the quest.
          </p>
        </div>

        {message.text && (
          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              TEAM ACCESS CODE
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TEAM-ALPHA-101"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#050b14',
                border: '1px solid #1e3a66',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                textAlign: 'center'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: '#00e5ff',
              color: '#001428',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            Enter Quest Arena
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#071224', borderRadius: '8px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          💡 Demo Access Codes: <code style={{ color: '#fbbf24' }}>TEAM-ALPHA-101</code> or <code style={{ color: '#fbbf24' }}>TEAM-BETA-202</code>
        </div>
      </div>
    );
  }

  const { progress, node, hints = [], pendingSubmission } = gameData || {};
  const isCompleted = progress?.is_completed;
  const currentPos = progress?.current_position || 1;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Team Header Bar */}
      <div
        style={{
          backgroundColor: '#0c1b33',
          borderRadius: '16px',
          border: '1px solid #1e3a66',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: 700 }}>
            Active Contestant Team
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {team.name}
          </h2>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '8px' }}>
            <span>Code: <strong style={{ color: '#fbbf24' }}>{team.access_code}</strong></span>
            {team.players && (
              <span>• Members: {team.players.map(p => `${p.name} (${p.ug_year})`).join(', ')}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Score Counter */}
          <div
            style={{
              backgroundColor: '#00284d',
              border: '1px solid #00e5ff',
              borderRadius: '12px',
              padding: '10px 20px',
              textAlign: 'center',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.25)'
            }}
          >
            <div style={{ fontSize: '11px', color: '#00e5ff', fontWeight: 700, textTransform: 'uppercase' }}>
              Team Score
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
              {gameData?.team?.score ?? team.score}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid #059669', padding: '4px 8px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                Live Sync (3s)
              </span>

              <button
                onClick={() => loadTeamData(team.id, team.event_id)}
                title="Refresh status"
                style={{
                  backgroundColor: '#112546',
                  border: '1px solid #1e3a66',
                  color: '#94a3b8',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
              </button>

              <button
                onClick={() => setTeam(null)}
                title="Log Out"
                style={{
                  backgroundColor: '#1f162b',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Game Path */}
      <div style={{ marginBottom: '24px' }}>
        <GamePath
          nodes={eventPath}
          currentPosition={currentPos}
          isCompleted={isCompleted}
        />
      </div>

      {/* Global Message Alert */}
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
            fontSize: '14px'
          }}
        >
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Completed State Celebration */}
      {isCompleted ? (
        <div
          style={{
            backgroundColor: '#062d22',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Award size={48} style={{ color: '#10b981', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>
            Tournament Completed!
          </h2>
          <p style={{ color: '#a7f3d0', fontSize: '16px', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0 auto' }}>
            Congratulations, <strong>{team.name}</strong>! You have conquered the Grand Zenith and finished all challenges on the path. Check the live leaderboard for final standings!
          </p>
        </div>
      ) : (
        /* Active Challenge Arena */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Left Column: Challenge & Submission */}
          <div
            style={{
              backgroundColor: '#0a1628',
              borderRadius: '16px',
              border: '1px solid #1e3a66',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: '#1e3a66',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '6px'
                  }}
                >
                  Level {node?.position} • {node?.type}
                </span>
                <span
                  style={{
                    color: '#10b981',
                    fontWeight: 800,
                    fontSize: '14px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  +{node?.points} Points
                </span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', marginTop: '12px' }}>
                {node?.title}
              </h3>
            </div>

            {/* Problem Statement Box */}
            <div
              style={{
                backgroundColor: '#050b14',
                border: '1px solid #1e3a66',
                borderRadius: '12px',
                padding: '18px',
                fontSize: '14px',
                color: '#e2e8f0',
                lineHeight: 1.6
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                Challenge Statement
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {node?.challenge_statement}
              </div>
            </div>

            {/* Pending Submission Banner or Submission Form */}
            {pendingSubmission ? (
              <div
                style={{
                  backgroundColor: '#261b04',
                  border: '1px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '18px',
                  color: '#fef3c7'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
                  <Clock size={18} style={{ color: '#fbbf24' }} /> Submission Under Review
                </div>
                <p style={{ fontSize: '13px', marginTop: '6px', color: '#fde68a' }}>
                  Your submission for this level has been dispatched to the judging dashboard. Points will be awarded and next level unlocked upon approval.
                </p>
                <div style={{ marginTop: '12px', backgroundColor: '#130d02', padding: '10px', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  Submitted: {pendingSubmission.content}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Terminal size={14} /> Answer or Code Solution
                  </label>
                  <textarea
                    required
                    rows="5"
                    placeholder="Type your final answer, decoded text, or code solution here..."
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#050b14',
                      border: '1px solid #1e3a66',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      lineHeight: 1.5
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '12px',
                    backgroundColor: '#00284d',
                    border: '1px solid #00e5ff',
                    color: '#00e5ff',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(0, 229, 255, 0.25)'
                  }}
                >
                  <Send size={16} /> Submit Solution for Review
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Hints and Debugging Task */}
          <div
            style={{
              backgroundColor: '#0a1628',
              borderRadius: '16px',
              border: '1px solid #1e3a66',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={20} style={{ color: '#fbbf24' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Tactical Hints
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Hints are locked behind specialized debugging tasks. Solve the code bug to reveal the hint!
            </p>

            {hints.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', backgroundColor: '#050b14', borderRadius: '8px' }}>
                No hints configured for this level.
              </div>
            ) : (
              hints.map((hint) => (
                <div
                  key={hint.id}
                  style={{
                    backgroundColor: hint.is_unlocked ? '#062d22' : '#050b14',
                    border: hint.is_unlocked ? '1px solid #10b981' : '1px solid #1e3a66',
                    borderRadius: '10px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: hint.is_unlocked ? '#10b981' : '#fbbf24' }}>
                      Hint #{hint.hint_number}
                    </span>
                    <span style={{ fontSize: '11px', color: hint.is_unlocked ? '#6ee7b7' : '#94a3b8' }}>
                      {hint.is_unlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}
                    </span>
                  </div>

                  {hint.is_unlocked ? (
                    <div style={{ color: '#d1fae5', fontSize: '13px', lineHeight: 1.5, backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                      {hint.hint_text}
                    </div>
                  ) : (
                    <div>
                      {/* Debugging Task Statement */}
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
                        {hint.debugging_task}
                      </div>

                      {/* Debugging Task Solution Form */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Type debugging solution..."
                          value={debuggingInputs[hint.id] || ''}
                          onChange={(e) => setDebuggingInputs({ ...debuggingInputs, [hint.id]: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            backgroundColor: '#0a1628',
                            border: '1px solid #1e3a66',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '13px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleUnlockHint(hint.id, node.id)}
                          disabled={actionLoading}
                          style={{
                            backgroundColor: '#00284d',
                            border: '1px solid #00e5ff',
                            color: '#00e5ff',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Unlock
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
