/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  EuiPopover,
  EuiContextMenu,
  EuiButtonIcon,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { LogActionDefinition, LogActionContext } from '../../types/log_actions';
import { logActionRegistry } from '../../services/log_action_registry';

interface LogActionMenuProps {
  /** The log document data */
  document: Record<string, any>;
  /** Current query context if available */
  query?: string;
  /** Index pattern or data source information */
  indexPattern?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Icon type for the trigger button */
  iconType?: string;
  /** Size of the trigger button */
  size?: 's' | 'm' | 'xs';
  /** Whether the trigger button is disabled */
  disabled?: boolean;
}

export const LogActionMenu: React.FC<LogActionMenuProps> = ({
  document,
  query,
  indexPattern,
  metadata,
  iconType = 'generate',
  size = 's',
  disabled = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<LogActionDefinition | null>(null);

  // Create the context for actions using useMemo to prevent unnecessary re-renders
  const actionContext: LogActionContext = useMemo(
    () => ({
      document,
      query,
      indexPattern,
      metadata,
    }),
    [document, query, indexPattern, metadata]
  );

  // Get compatible actions
  const compatibleActions = logActionRegistry.getCompatibleActions(actionContext);

  const closePopover = useCallback(() => {
    setIsPopoverOpen(false);
    setSelectedAction(null);
  }, []);

  const openPopover = useCallback(() => {
    setIsPopoverOpen(true);
  }, []);

  const handleActionSelect = useCallback((action: LogActionDefinition) => {
    setSelectedAction(action);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setSelectedAction(null);
  }, []);

  const handleActionResult = useCallback((result: { success: boolean; message?: string }) => {
    // Handle action results (show toast, etc.)
    if (result.success) {
      // Could show success toast here
    } else {
      // Could show error toast here
    }
  }, []);

  // Don't render if no compatible actions
  if (compatibleActions.length === 0) {
    return null;
  }

  // Create context menu panels
  const panels = [
    {
      id: 0,
      title: 'Log Actions',
      items: compatibleActions.map((action) => ({
        name: action.displayName,
        icon: action.iconType,
        onClick: () => handleActionSelect(action),
      })),
    },
  ];

  const button = (
    <EuiButtonIcon
      iconType={iconType}
      onClick={openPopover}
      size={size}
      disabled={disabled}
      aria-label="Open log actions menu"
      data-test-subj="logActionMenuButton"
    />
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      {selectedAction ? (
        // Render the selected action's component
        <div>
          <EuiFlexGroup
            alignItems="center"
            gutterSize="s"
            style={{ padding: '8px 16px', borderBottom: '1px solid #D3DAE6' }}
          >
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="arrowLeft"
                onClick={handleBackToMenu}
                size="s"
                aria-label="Back to menu"
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>{selectedAction.displayName}</strong>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          {/* Render the action's component */}
          <selectedAction.component
            context={actionContext}
            action={selectedAction}
            onClose={closePopover}
            onResult={handleActionResult}
          />
        </div>
      ) : (
        // Context menu
        <EuiContextMenu initialPanelId={0} panels={panels} />
      )}
    </EuiPopover>
  );
};
