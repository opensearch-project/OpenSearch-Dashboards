/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExploreDataTable } from '../data_table/explore_data_table';
import { ActionBar } from './action_bar/action_bar';
import { EXPLORE_ACTION_BAR_SLOT_ID } from './tabs';

export const LogsTab = () => {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(EXPLORE_ACTION_BAR_SLOT_ID));
  }, []);

  return (
    <div className="explore-logs-tab tab-container">
      {slot && createPortal(<ActionBar />, slot)}
      <ExploreDataTable />
    </div>
  );
};
