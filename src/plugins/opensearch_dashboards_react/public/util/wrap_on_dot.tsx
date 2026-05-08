/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Renders a dotted string with <wbr> elements after each dot, allowing the
 * browser to word-wrap at dot boundaries without affecting the copied text.
 */
export function wrapOnDot(str?: string): React.ReactNode {
  if (!str) return '';
  const parts = str.split('.');
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <>
              .<wbr />
            </>
          )}
          {part}
        </React.Fragment>
      ))}
    </>
  );
}
