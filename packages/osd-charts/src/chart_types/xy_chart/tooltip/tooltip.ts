/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import {
  AxisSpec,
  BasicSeriesSpec,
  isBandedSpec,
  isAreaSeriesSpec,
  isBarSeriesSpec,
  TickFormatterOptions,
} from '../utils/specs';
import { IndexedGeometry, BandedAccessorType } from '../../../utils/geometry';
import { getAccessorFormatLabel } from '../../../utils/accessor';
import { getSeriesName, SeriesKey } from '../utils/series';
import { TooltipValue } from '../../../specs';

export interface TooltipLegendValue {
  y0: any;
  y1: any;
}

export const Y0_ACCESSOR_POSTFIX = ' - lower';
export const Y1_ACCESSOR_POSTFIX = ' - upper';

export function getSeriesTooltipValues(
  tooltipValues: TooltipValue[],
  defaultValue?: string,
): Map<SeriesKey, TooltipLegendValue> {
  // map from seriesKey to TooltipLegendValue
  const seriesTooltipValues = new Map<SeriesKey, TooltipLegendValue>();

  tooltipValues.forEach(({ value, seriesIdentifier, valueAccessor }) => {
    const seriesValue = defaultValue ? defaultValue : value;
    const current = seriesTooltipValues.get(seriesIdentifier.key) || {};
    const tooltipValue: TooltipLegendValue = {
      y0: defaultValue,
      y1: defaultValue,
      ...current,
    };
    if (valueAccessor != null && (valueAccessor === 'y0' || valueAccessor === 'y1')) {
      tooltipValue[valueAccessor] = seriesValue;
    }
    seriesTooltipValues.set(seriesIdentifier.key, tooltipValue);
  });
  return seriesTooltipValues;
}

export function formatTooltip(
  { color, value: { x, y, accessor }, seriesIdentifier }: IndexedGeometry,
  spec: BasicSeriesSpec,
  isHeader: boolean,
  isHighlighted: boolean,
  hasSingleSeries: boolean,
  axisSpec?: AxisSpec,
): TooltipValue {
  let label = getSeriesName(seriesIdentifier, hasSingleSeries, true, spec);

  if (isBandedSpec(spec.y0Accessors) && (isAreaSeriesSpec(spec) || isBarSeriesSpec(spec))) {
    const { y0AccessorFormat = Y0_ACCESSOR_POSTFIX, y1AccessorFormat = Y1_ACCESSOR_POSTFIX } = spec;
    const formatter = accessor === BandedAccessorType.Y0 ? y0AccessorFormat : y1AccessorFormat;
    label = getAccessorFormatLabel(formatter, label);
  }
  const isFiltered = spec.filterSeriesInTooltip !== undefined ? spec.filterSeriesInTooltip(seriesIdentifier) : true;
  const isVisible = label === '' ? false : isFiltered;

  const value = isHeader ? x : y;
  const tickFormatOptions: TickFormatterOptions | undefined = spec.timeZone ? { timeZone: spec.timeZone } : undefined;
  return {
    seriesIdentifier,
    valueAccessor: accessor,
    label,
    value: axisSpec ? axisSpec.tickFormat(value, tickFormatOptions) : emptyFormatter(value),
    color,
    isHighlighted: isHeader ? false : isHighlighted,
    isVisible,
  };
}

function emptyFormatter<T>(value: T): T {
  return value;
}
