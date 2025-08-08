/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { useObservable } from 'react-use';
import { EuiSpacer } from '@elastic/eui';

import { ChartTypeSelector } from '../chart_type_selector';
import { ChartType, StyleOptions } from '../utils/use_visualization_types';
import { VisualizationBuilder } from '../visualization_builder';
import { AxisColumnMappings } from '../types';
import {
  convertMappingsToStrings,
  convertStringsToMappings,
} from '../visualization_container_utils';
import { visualizationRegistry } from '../visualization_registry';

interface StylePanelProps<T> {
  visualizationBuilder: VisualizationBuilder;
  className?: string;
}

export const StylePanel = <T extends ChartType>({
  visualizationBuilder,
  className,
}: StylePanelProps<T>) => {
  const visualizationData = useObservable(visualizationBuilder.data$);
  const chartConfig = useObservable(visualizationBuilder.visConfig$);
  const axesMapping = useObservable(visualizationBuilder.axesMapping$);

  const onStyleChange = useCallback(
    (changes: Partial<StyleOptions>) => {
      visualizationBuilder.updateStyles(changes);
    },
    [visualizationBuilder]
  );

  const onChartTypeChange = useCallback(
    (chartType: ChartType) => {
      visualizationBuilder.setCurrentChartType(chartType);
    },
    [visualizationBuilder]
  );

  const updateVisualization = useCallback(
    ({ mappings }: { mappings: AxisColumnMappings }) => {
      visualizationBuilder.setAxesMapping(convertMappingsToStrings(mappings));
    },
    [visualizationBuilder]
  );

  // TODO: refactor this and expose an observable from visualizationBuilder
  // Or refactor visConfig?.ui.style.render() function to accept axesMapping
  // and compute axisColumnMappings internally
  const axisColumnMappings = useMemo(() => {
    return convertStringsToMappings(axesMapping ?? {}, [
      ...(visualizationData?.categoricalColumns ?? []),
      ...(visualizationData?.numericalColumns ?? []),
      ...(visualizationData?.dateColumns ?? []),
    ]);
  }, [axesMapping, visualizationData]);

  if (!visualizationData) {
    return null;
  }

  const visConfig = chartConfig?.type
    ? visualizationRegistry.getVisualizationConfig(chartConfig?.type)
    : null;

  const bestMatch = visualizationRegistry.findBestMatch(
    visualizationData.numericalColumns,
    visualizationData.categoricalColumns,
    visualizationData.dateColumns
  );

  return (
    <div className={className} data-test-subj="exploreVisStylePanel">
      <ChartTypeSelector
        visualizationData={visualizationData}
        onChartTypeChange={onChartTypeChange}
        chartType={chartConfig?.type}
      />
      <EuiSpacer size="s" />
      {visConfig?.ui.style.render({
        styleOptions: chartConfig?.styles ?? ({} as any),
        onStyleChange,
        numericalColumns: visualizationData.numericalColumns,
        categoricalColumns: visualizationData.categoricalColumns,
        dateColumns: visualizationData.dateColumns,
        availableChartTypes: bestMatch?.rule.chartTypes,
        selectedChartType: chartConfig?.type,
        axisColumnMappings,
        updateVisualization,
      })}
    </div>
  );
};
