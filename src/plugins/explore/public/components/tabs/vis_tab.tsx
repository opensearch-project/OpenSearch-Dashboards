/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { VisualizationContainer } from '../visualizations/visualization_container';
import { ActionBar } from './action_bar/action_bar';

export const VisTab = () => {
  return (
    <div className="explore-vis-tab tab-container">
      <ActionBar />
      <VisualizationContainer />
    </div>
  );
};
