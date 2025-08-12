/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ActionBar } from './action_bar/action_bar';
import { PatternsContainer } from '../patterns_table/patterns_container';

/**
 * Logs tab component for displaying log entries
 */
export const PatternsTab = () => {
  return (
    <div className="explore-logs-tab tab-container">
      <ActionBar data-test-subj="patternsTabActionBar" />
      <PatternsContainer data-test-subj="patternsTabContainer" />
    </div>
  );
};
