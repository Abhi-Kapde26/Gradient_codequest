import React from 'react';
import { Award, CheckCircle, Clock, Zap, Users } from 'lucide-react';

export default function TeamCard({ team, rank }) {
  const {
    name,
    score,
    current_position,
    total_levels,
    current_node_title,
    current_node_type,
    is_completed,
    players = []
  } = team;

  // Medal styling for top 3
  const getRankBadge = () => {
    if (rank === 1) {
      return {
        bg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        color: '#000',
        text: '🥇 1ST'
      };
    }
    if (rank === 2) {
      return {
        bg: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
        color: '#000',
        text: '🥈 2ND'
      };
    }
    if (rank === 3) {
      return {
        bg: 'linear-gradient(135deg, #fdba74 0%, #c2410c 100%)',
        color: '#fff',
        text: '🥉 3RD'
      };
    }
    return {
      bg: '#1e293b',
      color: '#94a3b8',
      text: `#${rank}`
    };
  };

  const rankBadge = getRankBadge();

  return (
    <div
      style={{
        backgroundColor: '#0c1b33',
        borderRadius: '12px',
        border: rank === 1 ? '1px solid #fbbf24' : '1px solid #1e3a66',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: rank === 1 ? '0 0 20px rgba(251, 191, 36, 0.15)' : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease, border-color 0.2s ease'
      }}
    >
      {/* Left: Rank & Team Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            background: rankBadge.bg,
            color: rankBadge.color,
            fontWeight: 800,
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '20px',
            letterSpacing: '0.5px',
            minWidth: '55px',
            textAlign: 'center'
          }}
        >
          {rankBadge.text}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              {name}
            </h3>
            {is_completed && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.4)'
                }}
              >
                <CheckCircle size={12} /> FINISHED
              </span>
            )}
          </div>

          {/* Players List with UG Badges */}
          {players.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              <Users size={13} style={{ color: '#64748b' }} />
              {players.map((p, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    backgroundColor: '#112546',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    border: '1px solid #1e3a66'
                  }}
                >
                  {p.name} <strong style={{ color: '#38bdf8' }}>({p.ug_year})</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Level & Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Current Node / Level */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Current Level
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: is_completed ? '#10b981' : '#38bdf8'
              }}
            >
              {is_completed ? 'Completed All Levels' : `Level ${current_position}: ${current_node_title}`}
            </span>
          </div>
        </div>

        {/* Score Badge */}
        <div
          style={{
            backgroundColor: '#00284d',
            border: '1px solid #00e5ff',
            borderRadius: '10px',
            padding: '8px 16px',
            textAlign: 'center',
            minWidth: '90px'
          }}
        >
          <div style={{ fontSize: '10px', color: '#00e5ff', fontWeight: 700, textTransform: 'uppercase' }}>
            Score
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            {score}
          </div>
        </div>
      </div>
    </div>
  );
}
