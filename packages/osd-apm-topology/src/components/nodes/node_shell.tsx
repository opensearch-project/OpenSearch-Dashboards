/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

export interface NodeShellProps {
  children: React.ReactNode;
  borderColor?: string;
  backgroundColor?: string;
  isSelected?: boolean;
  isFaded?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
  className?: string;
  /** Additional inline style overrides */
  style?: React.CSSProperties;
  /** Glow color for hover/selection effects. Defaults to blue. */
  glowColor?: string;
  /** When true, omit built-in hover/selected shadow classes (caller handles glow). */
  disableGlow?: boolean;
  /** Test subject attribute for Cypress/FTR selectors */
  'data-test-subj'?: string;
  /** Accessible label for the node */
  'aria-label'?: string;
}

/**
 * Shared outer shell for all node types.
 * Renders 8 ReactFlow handles (source/target x 4 directions),
 * applies selection state, fade state, and border/background colors.
 * Keyboard-accessible: focusable and activatable via Enter/Space.
 */
export const NodeShell: React.FC<NodeShellProps> = ({
  children,
  borderColor,
  backgroundColor,
  isSelected = false,
  isFaded = false,
  onClick,
  onDoubleClick,
  className = '',
  style,
  glowColor,
  disableGlow = false,
  ...rest
}) => {
  const borderStyle = borderColor ? { borderColor } : {};
  const bgStyle = backgroundColor ? { backgroundColor } : {};
  const glowStyle = {
    '--osd-node-glow-color': glowColor ?? 'rgba(59, 130, 246, 0.4)',
  } as React.CSSProperties;
  const isInteractive = !!onClick;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick((event as unknown) as React.MouseEvent);
      }
    },
    [onClick]
  );

  return (
    <div
      className={`osd-resetFocusState osd:rounded-xl osd:border-2 osd:box-border osd:transition-all osd:duration-200
                ${
                  disableGlow
                    ? 'osd:outline-none osd:shadow-none osd:focus:outline-none osd:focus:shadow-none osd:hover:shadow-none'
                    : isSelected
                    ? 'osd:shadow-node-selected osd:outline-0'
                    : 'osd:hover:shadow-node-hover'
                }
                ${isFaded ? 'osd:opacity-30' : 'osd:opacity-100'}
                ${isInteractive ? 'osd:cursor-pointer' : ''}
                ${className}`}
      style={{
        ...borderStyle,
        ...bgStyle,
        ...glowStyle,
        ...style,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      data-test-subj={rest['data-test-subj']}
      aria-label={rest['aria-label']}
    >
      {children}

      <Handle type="source" position={Position.Right} id="source-right" />
      <Handle type="source" position={Position.Left} id="source-left" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" />
      <Handle type="source" position={Position.Top} id="source-top" />
      <Handle type="target" position={Position.Right} id="target-right" />
      <Handle type="target" position={Position.Left} id="target-left" />
      <Handle type="target" position={Position.Bottom} id="target-bottom" />
      <Handle type="target" position={Position.Top} id="target-top" />
    </div>
  );
};
