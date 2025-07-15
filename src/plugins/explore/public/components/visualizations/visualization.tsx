/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import React, { useMemo } from 'react';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import {
  VisualizationTypeResult,
  ChartType,
  ChartStyleControlMap,
} from './utils/use_visualization_types';
import { ChartTypeSelector } from './chart_type_selector';
import { UpdateVisualizationProps } from './visualization_container';
import { TableVis } from './table/table_vis';
import { TableChartStyleControls } from './table/table_vis_config';

export interface VisualizationProps<T extends ChartType> {
  expression: string | null;
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
  const columns = useMemo(() => {
    return [
      ...(visualizationData.numericalColumns ?? []),
      ...(visualizationData.categoricalColumns ?? []),
      ...(visualizationData.dateColumns ?? []),
    ];
  }, [
    visualizationData.numericalColumns,
    visualizationData.categoricalColumns,
    visualizationData.dateColumns,
  ]);

  if (!visualizationData) {
    return null;
  }

  const availableChartTypes = visualizationData.availableChartTypes;
  // TODO: refactor this, expression should be source of truth, if there was expression, it should render the expression.
  const hasSelectionMapping = Object.keys(visualizationData.axisColumnMappings!).length !== 0;
  const renderVisualization = () => {
    if (expression && hasSelectionMapping) {
      return (
        <ReactExpressionRenderer
          key={JSON.stringify(searchContext) + expression}
          expression={expression}
          searchContext={searchContext}
        />
      );
    }
    if (selectedChartType === 'table') {
      return (
        <TableVis
          pageSize={(styleOptions as TableChartStyleControls).pageSize}
          rows={visualizationData.transformedData ?? []}
          columns={columns}
        />
      );
    }
    return (
      <EuiEmptyPrompt
        iconType="visualizeApp"
        title={<h2>Select a chart type, and x and y axes fields to get started</h2>}
        body={<p>Try writing an aggregated query like this one:</p>}
      />
    );
  };
  return (
    <EuiFlexGroup gutterSize="none" style={{ minHeight: 0 }}>
      <EuiFlexItem>
        <EuiPanel
          hasBorder={false}
          hasShadow={false}
          data-test-subj="exploreVisualizationLoader"
          className="exploreVisPanel"
        >
          <div className="exploreVisPanel__inner">{renderVisualization()}</div>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={false} className="exploreVisStyleFlexItem">
        <EuiPanel hasShadow={false} paddingSize="s" className="exploreVisStylePanel">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="column" gutterSize="none">
              <ChartTypeSelector
                visualizationData={visualizationData}
                onChartTypeChange={onChartTypeChange}
              />
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {visualizationData.visualizationType?.ui.style.render({
              styleOptions: styleOptions ?? ({} as any),
              onStyleChange,
              numericalColumns: visualizationData.numericalColumns,
              categoricalColumns: visualizationData.categoricalColumns,
              dateColumns: visualizationData.dateColumns,
              availableChartTypes,
              selectedChartType,
              onChartTypeChange, // TODO remove
              axisColumnMappings: visualizationData.axisColumnMappings!,
              updateVisualization,
            })}
          </EuiFlexItem>
        </EuiPanel>
      </EuiFlexItem>
      {/* <div data-test-subj="exploreStylePanel" className="exploreVisStyleFlexItem">
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
