import React, { useState } from 'react';
import { Check, X, Clock, AlertCircle, Award } from 'lucide-react';
import { api } from '../services/api';

export default function SubmissionReview({
  submissions = [],
  adminKey,
  onReviewed
}) {
  const [feedbacks, setFeedbacks] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReview = async (submissionId, status) => {
    setProcessingId(submissionId);
    setErrorMsg('');
    try {
      const feedback = feedbacks[submissionId] || '';
      await api.reviewSubmission(submissionId, { status, feedback }, adminKey);
      if (onReviewed) onReviewed();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!submissions || submissions.length === 0) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          backgroundColor: '#0a1628',
          borderRadius: '12px',
          border: '1px dashed #1e3a66',
          color: '#64748b'
        }}
      >
        <Clock size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <p style={{ fontWeight: 600 }}>No pending submissions waiting for review.</p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>Teams submitting answers will appear here live.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errorMsg && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#fca5a5',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {submissions.map((sub) => {
        const feedback = feedbacks[sub.id] || '';

        return (
          <div
            key={sub.id}
            style={{
              backgroundColor: '#0c1b33',
              borderRadius: '12px',
              border: '1px solid #1e3a66',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span
                  style={{
                    backgroundColor: '#1e3a66',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  Level {sub.node_position} • {sub.node_type}
                </span>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
                  {sub.team_name}
                </h4>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Challenge: <strong>{sub.node_title}</strong>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#00284d',
                  border: '1px solid #00e5ff',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: '#00e5ff',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                +{sub.node_points} Points
              </div>
            </div>

            {/* Expected vs Submitted Answer */}
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                  Submitted Answer / Code
                </div>
                <pre
                  style={{
                    marginTop: '6px',
                    backgroundColor: '#050b14',
                    border: '1px solid #1e3a66',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}
                >
                  {sub.content}
                </pre>
              </div>

              {sub.expected_answer && (
                <div style={{ fontSize: '12px', color: '#94a3b8', backgroundColor: '#071224', padding: '8px 12px', borderRadius: '6px', border: '1px dashed #1e3a66' }}>
                  <strong style={{ color: '#fbbf24' }}>Admin Reference / Expected Key:</strong> {sub.expected_answer}
                </div>
              )}
            </div>

            {/* Admin Feedback Input */}
            <div style={{ marginTop: '16px' }}>
              <input
                type="text"
                placeholder="Optional feedback note for the team..."
                value={feedback}
                onChange={(e) => setFeedbacks({ ...feedbacks, [sub.id]: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#050b14',
                  border: '1px solid #1e3a66',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                disabled={processingId === sub.id}
                onClick={() => handleReview(sub.id, 'REJECTED')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#2b1111',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: processingId === sub.id ? 0.5 : 1
                }}
              >
                <X size={16} /> Reject (0 Pts)
              </button>

              <button
                disabled={processingId === sub.id}
                onClick={() => handleReview(sub.id, 'APPROVED')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#064e3b',
                  border: '1px solid #10b981',
                  color: '#6ee7b7',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  opacity: processingId === sub.id ? 0.5 : 1
                }}
              >
                <Check size={16} /> Approve & Advance Team
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
