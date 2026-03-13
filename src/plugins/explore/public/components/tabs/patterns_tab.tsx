/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ActionBar } from './action_bar/action_bar';
import { PatternsContainer } from '../patterns_table/patterns_container';
import { EXPLORE_ACTION_BAR_SLOT_ID } from './tabs';

export const PatternsTab = () => {
  const [filteredRowsCount, setFilteredRowsCount] = useState<number | undefined>(undefined);
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(EXPLORE_ACTION_BAR_SLOT_ID));
  }, []);

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredRowsCount(count);
  }, []);

  return (
    <div className="explore-logs-tab tab-container">
      {slot &&
        createPortal(
          <ActionBar data-test-subj="patternsTabActionBar" filteredRowsCount={filteredRowsCount} />,
          slot
        )}
      <PatternsContainer
        data-test-subj="patternsTabContainer"
        onFilteredCountChange={handleFilteredCountChange}
      />
    </div>
  );
};
