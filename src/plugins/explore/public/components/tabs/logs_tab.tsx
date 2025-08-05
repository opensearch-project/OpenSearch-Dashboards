/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ExploreDataTable } from '../data_table/explore_data_table';
import { ActionBar } from './action_bar/action_bar';

/**
 * Logs tab component for displaying log entries
 */
export const LogsTab = () => {
  return (
    <div className="explore-logs-tab tab-container">
      <ActionBar />
      <ExploreDataTable />
    </div>
  );
};
