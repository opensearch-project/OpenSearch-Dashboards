/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiSelect } from '@elastic/eui';
import React from 'react';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import { VisualizationTypeResult } from './utils/use_visualization_types';
import { LineChartStyleControls } from './line/line_vis_config';

export interface VisualizationProps {
  expression: string;
  searchContext: IExpressionLoaderParams['searchContext'];
  styleOptions: LineChartStyleControls;
  visualizationData: VisualizationTypeResult;
  onStyleChange: (newOptions: Partial<LineChartStyleControls>) => void;
  ReactExpressionRenderer: React.ComponentType<{
    expression: string;
    searchContext: IExpressionLoaderParams['searchContext'];
  }>;
}

export const Visualization: React.FC<VisualizationProps> = ({
  expression,
  searchContext,
  styleOptions,
  visualizationData,
  onStyleChange,
  ReactExpressionRenderer,
}) => {
  return (
    <EuiFlexGroup gutterSize="none">
      <EuiFlexItem className="visualizationContainer">
        <EuiPanel data-test-subj="visualizationLoader" className="visualizationPanel">
          <div className="visualizationPanel__inner">
            <ReactExpressionRenderer
              key={JSON.stringify(searchContext) + expression}
              expression={expression}
              searchContext={searchContext}
            />
          </div>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: '300px' }}>
        <EuiPanel className="stylePanel" data-test-subj="stylePanel">
          <div className="stylePanel__inner">
            {visualizationData.visualizationType?.ui.style.render({
              styleOptions,
              onStyleChange,
              numericalColumns: visualizationData.numericalColumns,
              categoricalColumns: visualizationData.categoricalColumns,
              dateColumns: visualizationData.dateColumns,
            })}
          </div>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
