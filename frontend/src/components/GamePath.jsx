import React from 'react';
import GameNode from './GameNode';

export default function GamePath({
  nodes = [],
  currentPosition = 1,
  isCompleted = false,
  teamsDistribution = {},
  selectedNodeId = null,
  onSelectNode = null
}) {
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        No levels defined in the event path yet.
      </div>
    );
  }

  // Sort nodes strictly by position
  const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);

  const getNodeStatus = (node) => {
    if (isCompleted) return 'completed';
    if (node.position < currentPosition) return 'completed';
    if (node.position === currentPosition) return 'active';
    return 'locked';
  };

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: '24px 16px',
        backgroundColor: '#071224',
        borderRadius: '16px',
        border: '1px solid #1a365d',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sortedNodes.length > 5 ? 'flex-start' : 'center',
          minWidth: 'fit-content',
          padding: '0 24px',
          margin: '0 auto'
        }}
      >
        {sortedNodes.map((node, index) => {
          const status = getNodeStatus(node);
          const isLast = index === sortedNodes.length - 1;
          const isSelected = selectedNodeId === node.id;
          const teamsAtNode = teamsDistribution[node.position] || 0;

          // Connector line properties
          const isConnectedActive = node.position < currentPosition;

          return (
            <React.Fragment key={node.id || index}>
              <GameNode
                node={node}
                status={status}
                isSelected={isSelected}
                teamCount={teamsAtNode}
                onClick={onSelectNode ? () => onSelectNode(node) : null}
              />

              {!isLast && (
                <div
                  style={{
                    flex: '1 0 60px',
                    height: '4px',
                    backgroundColor: isConnectedActive ? '#00e5ff' : '#1e3a66',
                    boxShadow: isConnectedActive ? '0 0 10px rgba(0, 229, 255, 0.7)' : 'none',
                    margin: '0 4px',
                    marginBottom: '40px', // align with the node shapes
                    position: 'relative',
                    transition: 'all 0.4s ease'
                  }}
                >
                  {node.position === currentPosition && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        left: '0',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#00e5ff',
                        boxShadow: '0 0 10px #00e5ff',
                        animation: 'edge-animation-fast 2s infinite linear'
                      }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
