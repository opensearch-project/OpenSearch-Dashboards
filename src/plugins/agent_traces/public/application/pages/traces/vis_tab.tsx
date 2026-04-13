/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationContainer } from '../../../components/visualizations/visualization_container';
import { ActionBar } from '../../../components/tabs/action_bar/action_bar';

export const VisTab = () => {
  return (
    <div className="agentTraces-vis-tab tab-container">
      <ActionBar />
      <VisualizationContainer />
    </div>
  );
};
