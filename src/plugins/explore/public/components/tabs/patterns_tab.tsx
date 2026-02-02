/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback } from 'react';
import { ActionBar } from './action_bar/action_bar';
import { PatternsContainer } from '../patterns_table/patterns_container';

export const PatternsTab = () => {
  const [filteredRowsCount, setFilteredRowsCount] = useState<number | undefined>(undefined);

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredRowsCount(count);
  }, []);

  return (
    <div className="explore-logs-tab tab-container">
      <ActionBar data-test-subj="patternsTabActionBar" filteredRowsCount={filteredRowsCount} />
      <PatternsContainer
        data-test-subj="patternsTabContainer"
        onFilteredCountChange={handleFilteredCountChange}
      />
    </div>
  );
};
