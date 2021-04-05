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
 * under the License.
 */

import { LegendItemExtraValues } from '../../../common/legend';
import { SeriesKey } from '../../../common/series_id';
import { TooltipValue } from '../../../specs';
import { getAccessorFormatLabel } from '../../../utils/accessor';
import { isDefined } from '../../../utils/common';
import { IndexedGeometry, BandedAccessorType } from '../../../utils/geometry';
import { defaultTickFormatter } from '../utils/axis_utils';
import { getSeriesName } from '../utils/series';
import {
  AxisSpec,
  BasicSeriesSpec,
  isBandedSpec,
  isAreaSeriesSpec,
  isBarSeriesSpec,
  TickFormatterOptions,
} from '../utils/specs';

/** @internal */
export const Y0_ACCESSOR_POSTFIX = ' - lower';
/** @internal */
export const Y1_ACCESSOR_POSTFIX = ' - upper';

/** @internal */
export function getHighligthedValues(
  tooltipValues: TooltipValue[],
  defaultValue?: string,
): Map<SeriesKey, LegendItemExtraValues> {
  const seriesTooltipValues = new Map<SeriesKey, LegendItemExtraValues>();

  tooltipValues.forEach(({ formattedValue, seriesIdentifier, valueAccessor }) => {
    const seriesValue = defaultValue || formattedValue;
    const current: LegendItemExtraValues = seriesTooltipValues.get(seriesIdentifier.key) ?? new Map();
    if (defaultValue) {
      if (!current.has(BandedAccessorType.Y0)) {
        current.set(BandedAccessorType.Y0, defaultValue);
      }
      if (!current.has(BandedAccessorType.Y1)) {
        current.set(BandedAccessorType.Y1, defaultValue);
      }
    }

    if (valueAccessor != null && (valueAccessor === BandedAccessorType.Y0 || valueAccessor === BandedAccessorType.Y1)) {
      current.set(valueAccessor, seriesValue);
    }
    seriesTooltipValues.set(seriesIdentifier.key, current);
  });
  return seriesTooltipValues;
}

/** @internal */
export function formatTooltip(
  { color, value: { x, y, mark, accessor, datum }, seriesIdentifier }: IndexedGeometry,
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
  const markValue = isHeader || mark === null ? null : mark;
  const tickFormatOptions: TickFormatterOptions | undefined = spec.timeZone ? { timeZone: spec.timeZone } : undefined;
  const tickFormatter =
    (isHeader ? axisSpec?.tickFormat : spec.tickFormat ?? axisSpec?.tickFormat) ?? defaultTickFormatter;

  return {
    seriesIdentifier,
    valueAccessor: accessor,
    label,
    value,
    formattedValue: tickFormatter(value, tickFormatOptions),
    markValue,
    ...(isDefined(markValue) && {
      formattedMarkValue: spec.markFormat
        ? spec.markFormat(markValue, tickFormatOptions)
        : defaultTickFormatter(markValue),
    }),
    color,
    isHighlighted: isHeader ? false : isHighlighted,
    isVisible,
    datum,
  };
}
