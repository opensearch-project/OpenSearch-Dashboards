/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';

/**
 * Wraps a child with a tree connector from its parent: a vertical line dropping
 * from the parent row above and a horizontal branch at the child's connect
 * point, forming an "L" so nested rows read as an indented tree. Shared by the
 * logs PPL and metrics PromQL visual builders.
 *
 * depth: indentation level (each level shifts right by LEVEL_INDENT px).
 * isLast: when true the vertical line stops at the branch instead of continuing
 *   down to the next sibling — giving the "L" join for the last/only child.
 * anchorY: fixed pixel offset for the horizontal branch (defaults to 50%), used
 *   when the child's connect point isn't its vertical center.
 * topReach: how far the vertical line reaches up past this row's top edge.
 *   Defaults to LEVEL_GAP (line starts at the parent row's bottom edge); pass a
 *   larger value to also clear the parent control's own bottom padding.
 */
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
