/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type StatusLevel = 'ok' | 'warning' | 'error' | 'critical' | 'unknown';

export interface StatusIndicatorProps {
  status: StatusLevel;
  /** Text label next to the icon (e.g., "SLI breach", "Timeout") */
  label?: string;
  /** Custom icon override; if omitted, a default colored dot is rendered */
  icon?: React.ReactNode;
}

const STATUS_COLORS: Record<StatusLevel, string> = {
  ok: 'var(--osd-color-status-ok, #22C55E)',
  warning: 'var(--osd-color-status-warning, #EAB308)',
  error: 'var(--osd-color-status-error, #EF4444)',
  critical: 'var(--osd-color-status-critical, #DC2626)',
  unknown: 'var(--osd-color-status-unknown, #6B7280)',
};

const STATUS_ICONS: Record<StatusLevel, string> = {
  ok: '\u2713', // checkmark
  warning: '\u26A0', // warning triangle
  error: '\u2716', // X mark
  critical: '\u2716', // X mark
  unknown: '\u2014', // em dash
};

/**
 * Universal status indicator. Renders a colored icon (or custom icon) with an
 * optional text label. Replaces hardcoded SLI status icon logic.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, icon }) => {
  const color = STATUS_COLORS[status];

  return (
    <span className="osd:inline-flex osd:items-center osd:gap-1">
      {icon ? (
        <span className="osd:flex osd:items-center" style={{ color }}>
          {icon}
        </span>
      ) : (
        <span
          className="osd:inline-flex osd:items-center osd:justify-center osd:w-4 osd:h-4 osd:text-xs osd:font-bold osd:leading-none"
          style={{ color }}
          role="img"
          aria-label={status}
        >
          {STATUS_ICONS[status]}
        </span>
      )}
      {label && <span className="osd:text-xs osd:text-body-secondary">{label}</span>}
    </span>
  );
};
