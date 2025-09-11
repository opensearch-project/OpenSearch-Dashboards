/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiText, EuiSpacer, EuiToolTip } from '@elastic/eui';
import { ContextPill } from './context_injector';
import { transformContextToAIAgent } from '../../utils/context_transformer';

interface ContextPillsProps {
  pills: ContextPill[];
  onRemovePill: (pillId: string) => void;
  onTogglePin: (pillId: string) => void;
  showDetails?: boolean;
}

/**
 * Component for displaying context pills above the chat input
 */
export const ContextPills: React.FC<ContextPillsProps> = ({
  pills,
  onRemovePill,
  onTogglePin,
  showDetails = false,
}) => {
  if (pills.length === 0) {
    return null;
  }

  const formatContextDetails = (pill: ContextPill): string => {
    const aiContext = transformContextToAIAgent(pill.context);
    const details = [];

    if (aiContext.data.timeRange) {
      details.push(`Time: ${aiContext.data.timeRange.from} - ${aiContext.data.timeRange.to}`);
    }

    if (aiContext.data.filters && aiContext.data.filters.length > 0) {
      details.push(`${aiContext.data.filters.length} filters active`);
    }

    if (aiContext.data.dashboardId) {
      details.push(`Dashboard: ${aiContext.data.dashboardId}`);
    }

    if (aiContext.data.indexPattern) {
      details.push(`Index: ${aiContext.data.indexPattern}`);
    }

    return details.join(', ') || 'No additional details';
  };

  return (
    <div data-test-subj="context-pills">
      <EuiText size="xs" color="subdued">
        Active context{pills.length > 1 ? 's' : ''}:
      </EuiText>
      <EuiSpacer size="xs" />
      <EuiFlexGroup wrap responsive={false} gutterSize="xs">
        {pills.map((pill) => (
          <EuiFlexItem grow={false} key={pill.id}>
            <EuiToolTip
              content={
                <div>
                  <div>
                    <strong>{pill.label}</strong>
                  </div>
                  <div>App: {pill.context.appId}</div>
                  <div>Captured: {new Date(pill.context.timestamp).toLocaleString()}</div>
                  {showDetails && <div>{formatContextDetails(pill)}</div>}
                </div>
              }
            >
              <EuiBadge
                color={pill.isPinned ? 'warning' : 'hollow'}
                iconType={pill.isPinned ? 'pin' : undefined}
                iconSide="left"
                onClick={() => onTogglePin(pill.id)}
                onClickAriaLabel={pill.isPinned ? 'Unpin context' : 'Pin context'}
                style={{ cursor: 'pointer' }}
              >
                <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
                  <EuiFlexItem grow={false}>{pill.label}</EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePill(pill.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 2px',
                        lineHeight: 1,
                        fontSize: '10px',
                      }}
                      aria-label="Remove context"
                      title="Remove context"
                    >
                      ×
                    </button>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiBadge>
            </EuiToolTip>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiSpacer size="s" />
    </div>
  );
};
