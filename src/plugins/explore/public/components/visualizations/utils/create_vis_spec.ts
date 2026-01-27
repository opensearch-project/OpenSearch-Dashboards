/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RenderChartConfig } from '../types';
import { VisData } from '../visualization_builder.types';
import { convertStringsToMappings } from '../visualization_builder_utils';
import { visualizationRegistry } from '../visualization_registry';
import { TimeRange } from '../../../../../data/public';
import { getAxisConfigByColumnMapping } from './axis';

interface Options {
  timeRange: TimeRange;
  data?: VisData;
  config?: RenderChartConfig;
}

export const createVisSpec = ({ timeRange, data, config }: Options) => {
  if (!data) {
    return;
  }

  if (!config?.type) {
    return;
  }

  const columns = [
    ...(data?.numericalColumns ?? []),
    ...(data?.categoricalColumns ?? []),
    ...(data?.dateColumns ?? []),
  ];

  const rule = visualizationRegistry.findRuleByAxesMapping(config?.axesMapping ?? {}, columns);
  if (!rule || !rule.toSpec) {
    return;
  }
  const standardAxes = 'standardAxes' in config.styles ? config.styles.standardAxes : [];
  const axisColumnMappings = convertStringsToMappings(config?.axesMapping ?? {}, columns);
  // initialize axis config
  const allAxisConfig = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
  const styles = { ...config.styles, standardAxes: allAxisConfig };

  return rule.toSpec(
    data.transformedData,
    data.numericalColumns,
    data.categoricalColumns,
    data.dateColumns,
    styles,
    config.type,
    axisColumnMappings,
    timeRange
  );
};
