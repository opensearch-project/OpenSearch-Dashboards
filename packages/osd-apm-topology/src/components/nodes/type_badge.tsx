/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface TypeBadgeProps {
  label: string;
  color: string;
  icon?: React.ReactNode;
  /** Text color override. Defaults to white; set to a dark color for light badges (e.g., amber). */
  textColor?: string;
}

/**
 * Colored pill badge with an optional icon and label.
 * Uses a pastel background derived from the color with the text in the full color.
 */
export const TypeBadge: React.FC<TypeBadgeProps> = ({ label, color, icon, textColor }) => (
  <span
    className="osd:inline-flex osd:items-center osd:gap-1 osd:px-2 osd:py-0.5 osd:rounded-full osd:text-xs osd:font-semibold osd:leading-none"
    style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color: textColor ?? color }}
  >
    {icon && <span className="osd:flex osd:items-center osd:w-3 osd:h-3">{icon}</span>}
    {label}
  </span>
);
