/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import React from 'react';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import {
  VisualizationTypeResult,
  ChartType,
  ChartStyleControlMap,
} from './utils/use_visualization_types';

export interface VisualizationProps<T extends ChartType> {
  expression: string;
  searchContext: IExpressionLoaderParams['searchContext'];
  styleOptions: ChartStyleControlMap[T];
  visualizationData: VisualizationTypeResult<T>;
  onStyleChange: (newOptions: Partial<ChartStyleControlMap[T]>) => void;
  selectedChartType?: string;
  onChartTypeChange?: (chartType: ChartType) => void;
  ReactExpressionRenderer: React.ComponentType<{
    expression: string;
    searchContext: IExpressionLoaderParams['searchContext'];
  }>;
}

export const Visualization = <T extends ChartType>({
  expression,
  searchContext,
  styleOptions,
  visualizationData,
  onStyleChange,
  selectedChartType,
  onChartTypeChange,
  ReactExpressionRenderer,
}: VisualizationProps<T>) => {
  const availableChartTypes = visualizationData.availableChartTypes;
  return (
    <EuiFlexGroup gutterSize="none">
      <EuiFlexItem>
        <EuiPanel data-test-subj="exploreVisualizationLoader" className="exploreVisPanel">
          <div className="exploreVisPanel__inner">
            <ReactExpressionRenderer
              key={JSON.stringify(searchContext) + expression}
              expression={expression}
              searchContext={searchContext}
            />
          </div>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <div data-test-subj="exploreStylePanel" className="exploreVisStylePanel">
          {visualizationData.visualizationType?.ui.style.render({
            styleOptions,
            onStyleChange,
            numericalColumns: visualizationData.numericalColumns,
            categoricalColumns: visualizationData.categoricalColumns,
            dateColumns: visualizationData.dateColumns,
            availableChartTypes,
            selectedChartType,
            onChartTypeChange,
          })}
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
