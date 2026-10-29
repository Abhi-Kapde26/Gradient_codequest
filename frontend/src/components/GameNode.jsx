import React from 'react';
import { Flag, Compass, Gem, Trophy, Lock, Check } from 'lucide-react';

export default function GameNode({
  node,
  status = 'locked', // 'completed' | 'active' | 'locked'
  isSelected = false,
  onClick,
  teamCount = 0
}) {
  const { position, type, title, points } = node;

  // Icon selector based on node type
  const renderIcon = () => {
    if (status === 'completed') return <Check size={20} className="text-emerald-400" />;
    if (status === 'locked') return <Lock size={18} className="text-slate-400" />;

    switch (type) {
      case 'START':
        return <Flag size={20} className="text-cyan-400" />;
      case 'QUEST':
        return <Compass size={22} className="text-blue-400" />;
      case 'TREASURE_HUNT':
        return <Gem size={20} className="text-amber-400" />;
      case 'FINISH':
        return <Trophy size={22} className="text-yellow-400" />;
      default:
        return <Compass size={20} />;
    }
  };

  // Color scheme based on status and type
  const getColors = () => {
    if (status === 'active') {
      return {
        bg: '#00284d',
        border: '#00e5ff',
        glow: '0 0 20px rgba(0, 229, 255, 0.6)',
        badgeBg: '#00e5ff',
        badgeColor: '#001428'
      };
    }
    if (status === 'completed') {
      return {
        bg: '#062d22',
        border: '#10b981',
        glow: '0 0 15px rgba(16, 185, 129, 0.4)',
        badgeBg: '#10b981',
        badgeColor: '#ffffff'
      };
    }
    // Locked
    return {
      bg: '#0a1628',
      border: '#1e3a66',
      glow: 'none',
      badgeBg: '#1e3a66',
      badgeColor: '#94a3b8'
    };
  };

  const colors = getColors();

  // Distinct shapes
  // START: Square (rx: 12px)
  // QUEST: Circle (borderRadius: 50%)
  // TREASURE_HUNT: Diamond (rotated 45 deg)
  // FINISH: Square (with double golden border effect)
  const renderShape = () => {
    if (type === 'QUEST') {
      return (
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: colors.bg,
            border: `2px solid ${colors.border}`,
            boxShadow: colors.glow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          {renderIcon()}
        </div>
      );
    }

    if (type === 'TREASURE_HUNT') {
      return (
        <div style={{ width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              transform: 'rotate(45deg)',
              backgroundColor: colors.bg,
              border: `2px solid ${colors.border}`,
              boxShadow: colors.glow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              borderRadius: '8px'
            }}
          >
            <div style={{ transform: 'rotate(-45deg)' }}>
              {renderIcon()}
            </div>
          </div>
        </div>
      );
    }

    // START or FINISH: Square
    return (
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: type === 'FINISH' ? '8px' : '12px',
          backgroundColor: colors.bg,
          border: `2px solid ${colors.border}`,
          boxShadow: colors.glow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          outline: type === 'FINISH' ? '2px dashed #f59e0b' : 'none',
          outlineOffset: '3px'
        }}
      >
        {renderIcon()}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        padding: '8px',
        position: 'relative',
        zIndex: 2,
        userSelect: 'none',
        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.2s ease'
      }}
    >
      {/* Node Shape */}
      <div style={{ position: 'relative' }}>
        {renderShape()}

        {/* Position Badge */}
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: colors.badgeBg,
            color: colors.badgeColor,
            fontWeight: 800,
            fontSize: '11px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
            border: '2px solid #050b14'
          }}
        >
          {position}
        </div>

        {/* Team presence badge if multiple teams currently on this node */}
        {teamCount > 0 && (
          <div
            title={`${teamCount} team(s) at this level`}
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              border: '1px solid #c4b5fd'
            }}
          >
            {teamCount} {teamCount === 1 ? 'team' : 'teams'}
          </div>
        )}
      </div>

      {/* Node Metadata */}
      <div style={{ marginTop: '12px', textAlign: 'center', maxWidth: '110px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: status === 'locked' ? '#64748b' : '#e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={title}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
          <span
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: type === 'TREASURE_HUNT' ? '#f59e0b' : '#38bdf8',
              fontWeight: 600
            }}
          >
            {type.replace('_', ' ')}
          </span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>•</span>
          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
            +{points} pts
          </span>
        </div>
      </div>
    </div>
  );
}
