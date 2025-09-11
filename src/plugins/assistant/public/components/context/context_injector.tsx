/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  EuiFormRow,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiComboBox,
  EuiComboBoxOptionOption,
} from '@elastic/eui';
import { StaticContext } from '../../../../context_provider/public';
import { ContextService } from '../../services/context_service';

export interface ContextPill {
  id: string;
  label: string;
  context: StaticContext;
  isPinned?: boolean;
}

interface ContextInjectorProps {
  contextService: ContextService;
  activePills: ContextPill[];
  onPillsChange: (pills: ContextPill[]) => void;
  onContextRefresh: () => void;
}

/**
 * Component for managing context injection into chat messages
 * Provides @ mention system and context pills display
 */
export const ContextInjector: React.FC<ContextInjectorProps> = ({
  contextService,
  activePills,
  onPillsChange,
  onContextRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableContextOptions, setAvailableContextOptions] = useState<EuiComboBoxOptionOption[]>(
    []
  );

  const handleRefreshContext = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await contextService.refreshCurrentContext();
      onContextRefresh();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh context:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [contextService, onContextRefresh]);

  const handleAddCurrentContext = useCallback(async () => {
    try {
      const currentContext = await contextService.getCurrentContext();
      if (currentContext) {
        const newPill: ContextPill = {
          id: `current-${Date.now()}`,
          label: `Current ${currentContext.appId}`,
          context: currentContext,
        };
        onPillsChange([...activePills, newPill]);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add current context:', error);
    }
  }, [contextService, activePills, onPillsChange]);

  const handleRemovePill = useCallback(
    (pillId: string) => {
      onPillsChange(activePills.filter((pill) => pill.id !== pillId));
    },
    [activePills, onPillsChange]
  );

  const handleTogglePinPill = useCallback(
    (pillId: string) => {
      onPillsChange(
        activePills.map((pill) =>
          pill.id === pillId ? { ...pill, isPinned: !pill.isPinned } : pill
        )
      );
    },
    [activePills, onPillsChange]
  );

  return (
    <div data-test-subj="context-injector">
      {activePills.length > 0 && (
        <>
          <EuiText size="xs" color="subdued">
            Active contexts:
          </EuiText>
          <EuiSpacer size="xs" />
          <EuiFlexGroup wrap responsive={false} gutterSize="xs">
            {activePills.map((pill) => (
              <EuiFlexItem grow={false} key={pill.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: pill.isPinned ? '#FEF7F1' : '#F5F7FA',
                    border: `1px solid ${pill.isPinned ? '#F5A700' : '#D3DAE6'}`,
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ marginRight: '4px' }}>
                    {pill.isPinned && '📌 '}
                    {pill.label}
                  </span>
                  <button
                    onClick={() => handleTogglePinPill(pill.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      marginLeft: '4px',
                      fontSize: '10px',
                    }}
                    title={pill.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <span role="img" aria-label={pill.isPinned ? 'Pinned' : 'Pin'}>
                      {pill.isPinned ? '📌' : '📍'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleRemovePill(pill.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      marginLeft: '4px',
                      fontSize: '10px',
                    }}
                    title="Remove"
                  >
                    <span role="img" aria-label="Remove">
                      ❌
                    </span>
                  </button>
                </div>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
          <EuiSpacer size="s" />
        </>
      )}

      <EuiFlexGroup alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            onClick={handleAddCurrentContext}
            iconType="plus"
            data-test-subj="add-current-context-button"
          >
            Add Current Context
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            onClick={handleRefreshContext}
            iconType="refresh"
            isLoading={isRefreshing}
            data-test-subj="refresh-context-button"
          >
            Refresh
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
