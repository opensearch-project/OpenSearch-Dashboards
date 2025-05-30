/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import React from 'react';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { VisualizationTypeResult } from '../../view_components/utils/use_visualization_types';
import { LineChartStyleControls } from './line/line_vis_config';

export interface DiscoverVisualizationProps {
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

export const DiscoverVisualization: React.FC<DiscoverVisualizationProps> = ({
  expression,
  searchContext,
  styleOptions,
  visualizationData,
  onStyleChange,
  ReactExpressionRenderer,
}) => {
  return (
    <EuiFlexGroup gutterSize="none">
      <EuiFlexItem grow={3}>
        <EuiPanel data-test-subj="visualizationLoader">
          <ReactExpressionRenderer
            key={JSON.stringify(searchContext) + expression}
            expression={expression}
            searchContext={searchContext}
          />
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={1}>
        <EuiPanel className="stylePanel" data-test-subj="stylePanel">
          {visualizationData.visualizationType?.ui.style.render({
            styleOptions,
            onStyleChange,
            numericalColumns: visualizationData.numericalColumns,
            categoricalColumns: visualizationData.categoricalColumns,
            dateColumns: visualizationData.dateColumns,
          })}
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
