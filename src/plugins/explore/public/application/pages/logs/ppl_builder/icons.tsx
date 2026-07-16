/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * The `</>` code-mode glyph used by the builder/code toggle (EUI has no
 * equivalent single-glyph icon). Passed as an `iconType` component to
 * EuiButtonIcon; `currentColor` lets the button's color drive it.
 */
export const CodeToggleIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4" />
  </svg>
);
