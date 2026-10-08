/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Loading skeletons for a card — a shimmer in the exact shape of the final content (histogram bars
 * on the left, log lines on the right), reserved to the final heights so there's no layout shift
 * and no "one loader then two" flash. Grafana-like: the skeleton reads as intentional, not a spinner.
 */

// A row of faux bars filling the histogram area.
export const CardSkeleton: React.FC<{ height: number }> = ({ height }) => {
  // Deterministic bar heights (no Math.random) so re-renders don't jitter.
  const heights = [40, 65, 50, 80, 55, 70, 45, 90, 60, 75, 50, 85, 62, 48, 78, 58];
  return (
    <div
      className="logStreamCard__skeletonHist"
      style={{ height }}
      data-test-subj="logsExploreCardSkeletonHist"
      aria-label="Loading histogram"
    >
      {heights.map((h, i) => (
        <span key={i} className="logStreamCard__skeletonBar" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
};

// A stack of faux log lines filling the log area.
export const LogLinesSkeleton: React.FC = () => (
  <div
    className="logStreamCard__skeletonLogs"
    data-test-subj="logsExploreCardSkeletonLogs"
    aria-label="Loading logs"
  >
    {[92, 78, 85, 70, 88, 60].map((w, i) => (
      <span key={i} className="logStreamCard__skeletonLine" style={{ width: `${w}%` }} />
    ))}
  </div>
);
