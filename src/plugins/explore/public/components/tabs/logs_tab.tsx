/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef } from 'react';
import { ActionBar } from './action_bar/action_bar';
import { ExploreResultsTable } from '../results_table';

/**
 * Logs tab component for displaying log entries
 */
export const LogsTab = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="explore-logs-tab tab-container" ref={containerRef}>
      <ActionBar />
      <ExploreResultsTable parentContainerRef={containerRef} />
    </div>
  );
};
