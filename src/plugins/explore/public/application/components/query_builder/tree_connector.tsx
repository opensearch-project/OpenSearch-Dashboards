/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';

const LEVEL_GAP = 12;
const LEVEL_INDENT = 24;

export const withConnector = (
  depth: number,
  content: React.ReactNode,
  isLast = false,
  anchorY?: number,
  topReach: number = LEVEL_GAP
) => (
  <div
    style={{
      marginLeft: depth * LEVEL_INDENT,
      display: 'flex',
      alignItems: 'center',
      marginTop: LEVEL_GAP,
    }}
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
          top: -topReach,
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
