/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StackWrapperProps } from './types';

export const StackWrapper: React.FC<StackWrapperProps> = ({
  children,
  hiddenChildrenCount,
  stackSpacing = 6,
  maxVisibleStacks = 2,
  button,
  isFaded,
}) => {
  // Create array for background stack layers
  const stackElements = Array.from({ length: maxVisibleStacks }, (_, index) => index + 1);

  return (
    <div className="osd:relative">
      {/* Background stack layers */}
      <div className="osd:grid osd:relative">
        {stackElements.map((i) => (
          <div
            key={i}
            className="osd:col-start-1 osd:row-start-1 osd:w-68 osd:min-h-24 osd:rounded-xl osd:border-2 osd:border-solid osd:border-status-default osd:bg-container-default/50"
            style={{
              transform: `translate(-${i * stackSpacing}px, -${i * stackSpacing}px)`,
              zIndex: maxVisibleStacks - i,
              opacity: isFaded ? '0.3' : '1',
            }}
            aria-hidden="true"
          />
        ))}

        {/* Main content (CelestialCard) */}
        <div
          className="osd:col-start-1 osd:row-start-1"
          style={{
            zIndex: maxVisibleStacks + 1,
          }}
        >
          {children}
        </div>
      </div>

      {/* Hidden children count badge */}
      <div
        className="osd:absolute osd:top-0 osd:right-0 osd:bg-blue-600 osd:text-white osd:text-xs osd:font-semibold osd:rounded-full osd:w-6 osd:h-6 osd:flex osd:items-center osd:justify-center osd:shadow-lg"
        style={{
          transform: 'translate(8px, -8px)',
          zIndex: maxVisibleStacks + 2,
        }}
        title={`${hiddenChildrenCount} hidden children`}
        role="status"
        aria-label={`${hiddenChildrenCount} hidden children`}
      >
        +{hiddenChildrenCount}
      </div>

      {/* Expand/Collapse Button - positioned relative to StackWrapper */}
      {button && (
        <div
          className="osd:absolute osd:top-1/2 osd:-translate-y-1/2"
          style={{
            right: '-16px', // -right-4 equivalent
            zIndex: maxVisibleStacks + 2,
          }}
        >
          {button}
        </div>
      )}
    </div>
  );
};
