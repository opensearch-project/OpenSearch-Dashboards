/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';

/**
 * Wraps a child with a tree connector from its parent:
 * vertical line from above, horizontal branch at child's vertical center.
 * anchorY: fixed pixel offset for the horizontal branch (defaults to 50%).
 */
const LEVEL_GAP = 12;

export const withConnector = (
  depth: number,
  content: React.ReactNode,
  isLast = false,
  anchorY?: number
) => (
  <div
    style={{ marginLeft: depth * 24, display: 'flex', alignItems: 'center', marginTop: LEVEL_GAP }}
  >
    <div
      style={{
        alignSelf: 'stretch',
        width: 16,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -LEVEL_GAP,
          left: 6,
          bottom: isLast ? (anchorY !== undefined ? `calc(100% - ${anchorY}px)` : '50%') : 0,
          borderLeft: `2px solid ${euiThemeVars.euiColorLightShade}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: anchorY !== undefined ? anchorY : '50%',
          left: 6,
          right: 0,
          borderBottom: `2px solid ${euiThemeVars.euiColorLightShade}`,
        }}
      />
    </div>
    <div style={{ minWidth: 0 }}>{content}</div>
  </div>
);
