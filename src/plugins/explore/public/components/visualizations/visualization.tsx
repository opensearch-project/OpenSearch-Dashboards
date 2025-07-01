/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import React from 'react';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import {
  VisualizationTypeResult,
  ChartType,
  ChartStyleControlMap,
} from './utils/use_visualization_types';
import { VisualizationEmptyState } from './visualization_empty_state';
import { UpdateVisualizationProps } from './visualization_container';

export interface VisualizationProps<T extends ChartType> {
  expression: string;
  searchContext: IExpressionLoaderParams['searchContext'];
  styleOptions: ChartStyleControlMap[T] | undefined;
  visualizationData: VisualizationTypeResult<T>;
  onStyleChange: (newOptions: Partial<ChartStyleControlMap[T]>) => void;
  selectedChartType?: string;
  onChartTypeChange?: (chartType: ChartType) => void;
  ReactExpressionRenderer: React.ComponentType<{
    expression: string;
    searchContext: IExpressionLoaderParams['searchContext'];
  }>;
  updateVisualization: (data: UpdateVisualizationProps) => void;
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
  updateVisualization,
}: VisualizationProps<T>) => {
  if (!visualizationData || !styleOptions || Object.keys(styleOptions).length === 0) {
    return null;
  }
  const availableChartTypes = visualizationData.availableChartTypes;
  return (
    <EuiFlexGroup gutterSize="none">
      <EuiFlexItem>
        <EuiPanel
          hasBorder={false}
          hasShadow={false}
          data-test-subj="exploreVisualizationLoader"
          className="exploreVisPanel"
        >
          <div className="exploreVisPanel__inner">
            {expression ? (
              <ReactExpressionRenderer
                key={JSON.stringify(searchContext) + expression}
                expression={expression}
                searchContext={searchContext}
              />
            ) : (
              <EuiEmptyPrompt
                iconType="visualizeApp"
                title={<h2>Select a chart type, and x and y axes fields to get started</h2>}
                body={<p>Try writing an aggregated query like this one:</p>}
              />
            )}
          </div>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={false} className="exploreVisStylePanel">
        <EuiPanel hasShadow={false}>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="column" gutterSize="none">
              <VisualizationEmptyState
                visualizationData={visualizationData as any}
                updateVisualization={updateVisualization}
              />
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {styleOptions &&
              visualizationData.visualizationType?.ui.style.render({
                styleOptions,
                onStyleChange,
                numericalColumns: visualizationData.numericalColumns,
                categoricalColumns: visualizationData.categoricalColumns,
                dateColumns: visualizationData.dateColumns,
                availableChartTypes,
                selectedChartType,
                onChartTypeChange,
              })}
          </EuiFlexItem>
        </EuiPanel>
      </EuiFlexItem>
      {/* <div data-test-subj="exploreStylePanel" className="exploreVisStylePanel">
          {visualizationData.visualizationType?.ui.style.render({
            styleOptions,
            onStyleChange,
            numericalColumns: selectedFields.numerical,
            categoricalColumns: selectedFields.categorical,
            dateColumns: selectedFields.date,
            availableChartTypes,
            selectedChartType,
            onChartTypeChange,
          })}
        </div> */}
    </EuiFlexGroup>
  );
};
