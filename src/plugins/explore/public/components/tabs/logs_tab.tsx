/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { memo } from 'react';
import { ExploreDataTable } from '../data_table/explore_data_table';
import { ActionBar } from './action_bar/action_bar';

/**
 * Logs tab component for displaying log entries
 */
const LogsTabComponent = () => {
  return (
    <div className="explore-logs-tab tab-container">
      <ActionBar />
      <ExploreDataTable />
    </div>
  );
};

export const LogsTab = memo(LogsTabComponent);
