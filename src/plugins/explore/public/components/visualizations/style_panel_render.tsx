/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { useObservable } from 'react-use';
import { EuiSpacer } from '@elastic/eui';
import { Observable } from 'rxjs';

import { ChartTypeSelector } from './chart_type_selector';
import {
  ChartStylesMapping,
  ChartType,
  StyleOptions,
  VisualizationType,
} from './utils/use_visualization_types';
import { AxisColumnMappings, RenderChartConfig } from './types';
import { convertMappingsToStrings, convertStringsToMappings } from './visualization_builder_utils';
import { visualizationRegistry } from './visualization_registry';
import { VisData } from './visualization_builder.types';

interface StylePanelProps<T> {
  data$: Observable<VisData | undefined>;
  config$: Observable<RenderChartConfig | undefined>;
  onStyleChange: (changes: Partial<StyleOptions>) => void;
  onChartTypeChange: (type: ChartType) => void;
  onAxesMappingChange: (mappings: Record<string, string>) => void;
  className?: string;
}

export const StylePanelRender = <T extends ChartType>({
  data$,
  config$,
  onStyleChange,
  onChartTypeChange,
  onAxesMappingChange,
  className,
}: StylePanelProps<T>) => {
  const visualizationData = useObservable(data$);
  const chartConfig = useObservable(config$);
  const axesMapping = chartConfig?.axesMapping;

  const updateVisualization = useCallback(
    ({ mappings }: { mappings: AxisColumnMappings }) => {
      onAxesMappingChange(convertMappingsToStrings(mappings));
    },
    [onAxesMappingChange]
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
    ? (visualizationRegistry.getVisualizationConfig(chartConfig?.type) as
        | VisualizationType<T>
        | undefined)
    : null;

  const bestMatch = visualizationRegistry.findBestMatch(
    visualizationData.numericalColumns,
    visualizationData.categoricalColumns,
    visualizationData.dateColumns
  );

  if (!chartConfig?.styles || !visConfig) {
    return null;
  }

  return (
    <div className={className} data-test-subj="exploreVisStylePanel">
      <ChartTypeSelector
        visualizationData={visualizationData}
        onChartTypeChange={onChartTypeChange}
        chartType={chartConfig?.type}
      />
      <EuiSpacer size="s" />
      {visConfig.ui.style.render({
        styleOptions: chartConfig.styles as ChartStylesMapping[T],
        onStyleChange,
        numericalColumns: visualizationData.numericalColumns,
        categoricalColumns: visualizationData.categoricalColumns,
        dateColumns: visualizationData.dateColumns,
        availableChartTypes: bestMatch?.rule.chartTypes,
        selectedChartType: chartConfig.type,
        axisColumnMappings,
        updateVisualization,
      })}
    </div>
  );
};
