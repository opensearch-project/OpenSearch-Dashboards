/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AgentSpansIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="currentColor"
    {...props}
  >
    <g transform="rotate(-90 16 16)">
      <path d="M16 32C7.16344 32 0 24.8366 0 16 0 7.16344 7.16344 0 16 0c8.8366 0 16 7.16344 16 16h-2c0-7.73199-6.268-14-14-14C8.26801 2 2 8.26801 2 16c0 7.732 6.26801 14 14 14v2z" />
      <path d="M27 20v12h-2V20h2zm-5 4v8h-2v-8h2zm10-2v10h-2V22h2z" />
      <g transform="translate(16, 17)">
        <path d="M0,-6.5 C0,-3 -3,0 -6.5,0 C-3,0 0,3 0,6.5 C0,3 3,0 6.5,0 C3,0 0,-3 0,-6.5Z" />
      </g>
    </g>
  </svg>
);
