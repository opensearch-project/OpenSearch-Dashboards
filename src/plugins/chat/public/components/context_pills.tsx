/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiBadge,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
} from '@elastic/eui';
import { ContextItem, ContextState, CONTEXT_COLORS } from '../types/context';
import { ChatContextManager } from '../services/chat_context_manager';

interface ContextPillsProps {
  contextManager: ChatContextManager;
  isCompact?: boolean;
}

export const ContextPills: React.FC<ContextPillsProps> = ({
  contextManager,
  isCompact = false,
}) => {
  const [contextState, setContextState] = useState<ContextState>({
    activeContexts: [],
    pinnedContextIds: new Set(),
  });

  useEffect(() => {
    const subscription = contextManager.getContextState$().subscribe(setContextState);
    return () => subscription.unsubscribe();
  }, [contextManager]);

  const handleExclude = (contextId: string) => {
    contextManager.excludeContext(contextId);
  };

  const handleTogglePin = (contextId: string) => {
    contextManager.togglePinContext(contextId);
  };

  if (contextState.activeContexts.length === 0) {
    return (
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiBadge color="subdued">No context available</EuiBadge>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <EuiFlexGroup gutterSize="s" wrap responsive={false} className="context-pills-container">
      {contextState.activeContexts.map((context) => (
        <EuiFlexItem key={context.id} grow={false}>
          <div className="context-pill-wrapper">
            <EuiBadge
              color={CONTEXT_COLORS[context.type]}
              className="context-pill"
              style={{
                backgroundColor: CONTEXT_COLORS[context.type],
                color: '#fff',
                border: context.isPinned ? '2px solid #006BB4' : 'none',
                paddingRight: isCompact ? '4px' : '24px',
                position: 'relative',
              }}
            >
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                {context.isPinned && (
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="pin" size="s" color="inherit" />
                  </EuiFlexItem>
                )}
                <EuiFlexItem grow={false}>
                  <span>{context.label}</span>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiBadge>
            {!isCompact && (
              <div className="context-pill-actions">
                <EuiToolTip content={context.isPinned ? 'Unpin' : 'Pin'}>
                  <EuiButtonIcon
                    iconType="pin"
                    size="xs"
                    color={context.isPinned ? 'primary' : 'subdued'}
                    onClick={() => handleTogglePin(context.id)}
                    aria-label={context.isPinned ? 'Unpin context' : 'Pin context'}
                  />
                </EuiToolTip>
                <EuiToolTip content="Exclude from context">
                  <EuiButtonIcon
                    iconType="cross"
                    size="xs"
                    color="danger"
                    onClick={() => handleExclude(context.id)}
                    aria-label="Exclude context"
                  />
                </EuiToolTip>
              </div>
            )}
          </div>
        </EuiFlexItem>
      ))}
      <EuiFlexItem grow={false}>
        <EuiToolTip content="Refresh context">
          <EuiButtonIcon
            iconType="refresh"
            size="s"
            onClick={() => contextManager.refreshContext()}
            aria-label="Refresh context"
          />
        </EuiToolTip>
      </EuiFlexItem>
      <style>{`
        .context-pills-container {
          padding: 8px 0;
        }
        
        .context-pill-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        
        .context-pill {
          transition: all 0.2s ease;
        }
        
        .context-pill-actions {
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          display: none;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 2px;
        }
        
        .context-pill-wrapper:hover .context-pill-actions {
          display: flex;
          gap: 2px;
        }
        
        .context-pill-actions .euiButtonIcon {
          width: 20px !important;
          height: 20px !important;
        }
        
        .context-pill-actions .euiButtonIcon svg {
          width: 12px !important;
          height: 12px !important;
        }
      `}</style>
    </EuiFlexGroup>
  );
};
