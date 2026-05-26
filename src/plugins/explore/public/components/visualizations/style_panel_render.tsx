/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { useObservable } from 'react-use';
import { EuiSpacer } from '@elastic/eui';
import { Observable } from 'rxjs';

import { ChartTypeSelector } from './chart_type_selector';
import { SplitSettingsAccordion } from './split_settings_accordion';
import { ChartStylesMapping, ChartType, StyleOptions } from './utils/use_visualization_types';
import { AxisFieldNameMappings, RenderChartConfig } from './types';
import { convertStringsToMappings } from './visualization_builder_utils';
import { visualizationRegistry } from './visualization_registry';
import { SplitConfig, VisData } from './visualization_builder.types';
import { getAxisConfigByColumnMapping } from './utils/axis';
import { AxesSelectPanel } from './style_panel/axes/axes_selector';

interface StylePanelProps<T> {
  data$: Observable<VisData | undefined>;
  config$: Observable<RenderChartConfig | undefined>;
  onStyleChange: (changes: Partial<StyleOptions>) => void;
  onChartTypeChange: (type: ChartType) => void;
  onAxesMappingChange: (mappings: AxisFieldNameMappings) => void;
  onSplitConfigChange: (config: Partial<SplitConfig>) => void;
  className?: string;
}

export const StylePanelRender = <T extends ChartType>({
  data$,
  config$,
  onStyleChange,
  onChartTypeChange,
  onAxesMappingChange,
  onSplitConfigChange,
  className,
}: StylePanelProps<T>) => {
  const visualizationData = useObservable(data$);
  const chartConfig = useObservable(config$);
  const axesMapping = chartConfig?.axesMapping;

  const updateVisualization = useCallback(
    ({ mappings }: { mappings: AxisFieldNameMappings }) => {
      onAxesMappingChange(mappings);
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

  const styleOptions = useMemo(() => {
    if (chartConfig) {
      const standardAxes =
        'standardAxes' in chartConfig.styles ? chartConfig.styles.standardAxes : [];
      // initialize axis config
      const allAxisConfig = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
      return { ...chartConfig.styles, standardAxes: allAxisConfig };
    }
    return null;
  }, [axisColumnMappings, chartConfig]);

  if (!visualizationData) {
    return null;
  }

  const visConfig = chartConfig?.type
    ? visualizationRegistry.getVisualization(chartConfig?.type)
    : null;

  if (!chartConfig?.styles || !visConfig || !styleOptions) {
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
      <AxesSelectPanel
        numericalColumns={visualizationData.numericalColumns}
        categoricalColumns={visualizationData.categoricalColumns}
        dateColumns={visualizationData.dateColumns}
        currentMapping={axisColumnMappings}
        updateVisualization={updateVisualization}
        chartType={chartConfig.type}
      />
      {chartConfig?.type !== 'table' && (
        <SplitSettingsAccordion
          categoricalColumns={visualizationData.categoricalColumns}
          numericalColumns={visualizationData.numericalColumns}
          splitField={chartConfig?.splitField}
          splitLayout={chartConfig?.splitLayout}
          showSplitLabel={chartConfig?.showSplitLabel}
          onSplitConfigChange={onSplitConfigChange}
        />
      )}
      {visConfig.ui.style.render({
        styleOptions: styleOptions as ChartStylesMapping[T],
        onStyleChange,
        numericalColumns: visualizationData.numericalColumns,
        categoricalColumns: visualizationData.categoricalColumns,
        dateColumns: visualizationData.dateColumns,
        axisColumnMappings,
        updateVisualization,
      })}
    </div>
  );
};
