/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Agent monitoring "Spans" nav icon: the OUI `visTagCloud` glyph with a small
 * diamond AI badge overlaid in the top-right corner. Drawn entirely in
 * `currentColor` so it inherits the nav item text color (incl. active/hover).
 *
 * The badge's halo circle uses the `agentBadgeHalo` class, which is styled in
 * core's `collapsible_nav_group_enabled.scss` (theme-aware fill). This icon is
 * intended for the side nav only; if it is ever rendered OUTSIDE core chrome
 * (breadcrumb, tab, page header), that class won't be in scope and the halo
 * will be transparent — give it an explicit fill there.
 */
export const AgentSpansIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    {...props}
  >
    {/* Base: OUI visTagCloud */}
    <path d="M1.5 9.047a.5.5 0 1 0 0 1h13a.5.5 0 0 0 0-1h-13Zm0-1h13a1.5 1.5 0 0 1 0 3h-13a1.5 1.5 0 0 1 0-3ZM10 13a.5.5 0 1 1 0 1H4a.5.5 0 1 1 0-1h6ZM8.001 2.015a.5.5 0 1 1-.002 1l-5-.015a.5.5 0 1 1 .003-1l5 .015ZM14 5a.5.5 0 1 1 0 1H6a.5.5 0 0 1 0-1h8Z" />
    {/* AI diamond badge (top-right). The halo is punched out in the sidebar
        background color so the badge reads cleanly over the tag lines in both
        light and dark themes; the diamond itself is solid (filled), matching
        the Traces sparkle. */}
    <circle cx="12.6" cy="3.4" r="4" className="agentBadgeHalo" />
    <g transform="translate(12.6 3.4)">
      <path d="M0,-3.2 L3.2,0 L0,3.2 L-3.2,0 Z" />
    </g>
  </svg>
);
