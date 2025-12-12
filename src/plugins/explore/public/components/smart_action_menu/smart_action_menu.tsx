/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  EuiPopover,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
} from '@elastic/eui';
import { createPortal } from 'react-dom';
import { smartActionRegistry } from '../../services/smart_action_registry/smart_action_registry_service';
import { SmartActionContext, SmartActionDefinition } from '../../types/smart_actions';

// Smart positioning utility to handle collision detection and optimal placement
const calculateOptimalPosition = (
  originalPosition: { x: number; y: number },
  estimatedMenuWidth = 500,
  estimatedMenuHeight = 300
): { x: number; y: number; anchorPosition: string } => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const margin = 20; // Safety margin from screen edges

  const position = { ...originalPosition };
  let anchorPosition = 'downRight'; // Default anchor position

  // Check if menu would go off the right edge
  if (position.x + estimatedMenuWidth + margin > viewport.width) {
    position.x = originalPosition.x - estimatedMenuWidth - 10;
    anchorPosition = 'downLeft';

    // If still off-screen on left, clamp to left edge
    if (position.x < margin) {
      position.x = margin;
      anchorPosition = 'downCenter';
    }
  }

  // Check if menu would go off the bottom edge
  if (position.y + estimatedMenuHeight + margin > viewport.height) {
    position.y = originalPosition.y - estimatedMenuHeight - 10;
    anchorPosition = anchorPosition.replace('down', 'up');

    // If still off-screen on top, clamp to top edge
    if (position.y < margin) {
      position.y = margin;
    }
  }

  // Ensure position is within safe bounds
  position.x = Math.max(margin, Math.min(position.x, viewport.width - estimatedMenuWidth - margin));
  position.y = Math.max(
    margin,
    Math.min(position.y, viewport.height - estimatedMenuHeight - margin)
  );

  return { ...position, anchorPosition };
};

export interface SmartActionMenuProps {
  /** The field context from the right-click event */
  fieldContext: SmartActionContext['fieldContext'];
  /** Position to display the menu */
  position: { x: number; y: number };
  /** Callback when menu is closed */
  onClose: () => void;
}

export const SmartActionMenu: React.FC<SmartActionMenuProps> = ({
  fieldContext,
  position,
  onClose,
}) => {
  const [selectedAction, setSelectedAction] = useState<SmartActionDefinition | null>(null);
  // Create smart action context from field context
  const smartActionContext = useMemo<SmartActionContext>(
    () => ({
      fieldContext,
    }),
    [fieldContext]
  );

  // Get compatible actions from registry
  const compatibleActions = useMemo(() => {
    const actions = smartActionRegistry.getCompatibleActions(smartActionContext);
    return actions;
  }, [smartActionContext]);

  // Calculate optimal position with collision detection
  const { x: optimizedX, y: optimizedY, anchorPosition } = useMemo(() => {
    const result = calculateOptimalPosition(position);
    return result;
  }, [position]);

  const handleClose = useCallback(() => {
    setSelectedAction(null);
    onClose();
  }, [onClose]);

  const handleActionClick = useCallback((action: SmartActionDefinition) => {
    setSelectedAction(action);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setSelectedAction(null);
  }, []);

  // Don't render if no actions available
  if (compatibleActions.length === 0) {
    onClose();
    return null;
  }

  // Note: Using direct CSS positioning instead of EuiPopover anchor system

  return createPortal(
    <>
      {/* Backdrop for clicking outside to close */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          backgroundColor: 'transparent',
        }}
        onClick={handleClose}
      />

      {/* Direct positioned menu */}
      <div
        style={{
          position: 'fixed',
          left: `${optimizedX}px`,
          top: `${optimizedY}px`,
          zIndex: 9999,
          minWidth: '300px',
          maxWidth: 'min(600px, 90vw)',
          backgroundColor: 'white',
          border: '1px solid #d3dae6',
          borderRadius: '6px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          padding: '0',
        }}
        data-test-subj="smart-action-direct-positioned"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop clicks from closing
      >
        {selectedAction ? (
          // Action Detail View
          <div style={{ padding: '16px' }}>
            {/* Back Button */}
            <div style={{ marginBottom: '12px' }}>
              <EuiButtonEmpty
                size="xs"
                iconType="arrowLeft"
                onClick={handleBackToMenu}
                flush="left"
              >
                Back to Smart Actions
              </EuiButtonEmpty>
            </div>

            {/* Action Component */}
            {(() => {
              const ActionComponent = selectedAction.component;
              return (
                <ActionComponent
                  context={smartActionContext}
                  action={selectedAction}
                  onClose={handleClose}
                  onResult={(result) => {
                    if (result.success) {
                      handleClose();
                    }
                  }}
                />
              );
            })()}
          </div>
        ) : (
          // Action Menu List
          <div>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #d3dae6' }}>
              <EuiText size="s">
                <strong>Smart Actions</strong>
              </EuiText>
            </div>
            <EuiContextMenuPanel
              items={compatibleActions.map((action) => (
                <EuiContextMenuItem
                  key={action.id}
                  icon={action.iconType}
                  onClick={() => handleActionClick(action)}
                  data-test-subj={`smartAction-${action.id}`}
                >
                  {action.displayName}
                </EuiContextMenuItem>
              ))}
            />
          </div>
        )}
      </div>
    </>,
    document.body
  );
};
