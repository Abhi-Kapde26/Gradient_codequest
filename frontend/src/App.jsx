import React, { useState } from 'react';
import { Trophy, Shield, Gamepad2, Sparkles, Terminal } from 'lucide-react';
import AdminDashboard from './pages/AdminDashboard';
import TeamGame from './pages/TeamGame';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('leaderboard'); // 'leaderboard' | 'game' | 'admin'
  const [adminKey, setAdminKey] = useState('admin-secret-codequest-2026');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: '#0a1628',
          borderBottom: '1px solid #1e3a66',
          padding: '14px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Logo Branding */}
          <div
            onClick={() => setCurrentPage('leaderboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(0, 229, 255, 0.5)'
              }}
            >
              <Terminal size={20} color="#050b14" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#f8fafc', lineHeight: 1.1 }}>
                GRADIENT <span style={{ color: '#00e5ff' }}>CODEQUEST</span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Game-Based CP Platform
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage('leaderboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: currentPage === 'leaderboard' ? '#00284d' : 'transparent',
                border: currentPage === 'leaderboard' ? '1px solid #00e5ff' : '1px solid transparent',
                color: currentPage === 'leaderboard' ? '#00e5ff' : '#94a3b8'
              }}
            >
              <Trophy size={16} /> Leaderboard
            </button>

            <button
              onClick={() => setCurrentPage('game')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: currentPage === 'game' ? '#00284d' : 'transparent',
                border: currentPage === 'game' ? '1px solid #00e5ff' : '1px solid transparent',
                color: currentPage === 'game' ? '#00e5ff' : '#94a3b8'
              }}
            >
              <Gamepad2 size={16} /> Team Quest
            </button>

            <button
              onClick={() => setCurrentPage('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: currentPage === 'admin' ? '#00284d' : 'transparent',
                border: currentPage === 'admin' ? '1px solid #00e5ff' : '1px solid transparent',
                color: currentPage === 'admin' ? '#00e5ff' : '#94a3b8'
              }}
            >
              <Shield size={16} /> Admin Console
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content View */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {currentPage === 'leaderboard' && <Leaderboard />}
        {currentPage === 'game' && <TeamGame defaultTeamCode="TEAM-ALPHA-101" />}
        {currentPage === 'admin' && <AdminDashboard adminKey={adminKey} />}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #1e3a66',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#64748b',
          backgroundColor: '#071224'
        }}
      >
        Gradient CodeQuest &copy; 2026 • Free-tier React + Vite + Node.js + Supabase Architecture
      </footer>
    </div>
  );
}
