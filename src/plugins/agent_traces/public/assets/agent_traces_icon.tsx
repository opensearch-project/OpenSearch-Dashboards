/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Agent monitoring "Traces" nav icon: the OUI `visTable` glyph with a small AI
 * sparkle badge overlaid in the top-right corner. Drawn entirely in
 * `currentColor` so it inherits the nav item text color (incl. active/hover).
 */
export const AgentTracesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    {...props}
  >
    {/* Base: OUI visTable */}
    <path d="M16 3v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1Zm-1 0V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v1h14Zm0 1H1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4ZM4.5 6a.5.5 0 0 1 0 1H2.496a.5.5 0 1 1 0-1H4.5Zm9 0a.5.5 0 1 1 0 1h-6a.5.5 0 0 1 0-1h6Zm-9 3a.5.5 0 0 1 0 1H2.496a.5.5 0 1 1 0-1H4.5Zm9 0a.5.5 0 1 1 0 1h-6a.5.5 0 0 1 0-1h6Zm-9 3a.5.5 0 1 1 0 1H2.496a.5.5 0 1 1 0-1H4.5Zm9 0a.5.5 0 1 1 0 1h-6a.5.5 0 1 1 0-1h6Z" />
    {/* AI sparkle badge (top-right). A white halo lifts it off the table lines. */}
    <circle cx="12.2" cy="3.8" r="4" fill="var(--ouiColorEmptyShade, #fff)" />
    <g transform="translate(12.2 3.8)">
      <path d="M0,-3.4 C0,-1.6 -1.6,0 -3.4,0 C-1.6,0 0,1.6 0,3.4 C0,1.6 1.6,0 3.4,0 C1.6,0 0,-1.6 0,-3.4Z" />
    </g>
  </svg>
);
