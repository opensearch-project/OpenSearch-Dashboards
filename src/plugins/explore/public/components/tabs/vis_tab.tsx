/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VisualizationContainer } from '../visualizations/visualization_container';
import { ActionBar } from './action_bar/action_bar';
import { EXPLORE_ACTION_BAR_SLOT_ID } from './tabs';

export const VisTab = () => {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(EXPLORE_ACTION_BAR_SLOT_ID));
  }, []);

  return (
    <div className="explore-vis-tab tab-container">
      {slot && createPortal(<ActionBar />, slot)}
      <VisualizationContainer />
    </div>
  );
};
