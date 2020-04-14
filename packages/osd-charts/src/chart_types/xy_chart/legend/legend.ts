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

import { getAxesSpecForSpecId, getSpecsById } from '../state/utils';
import { identity, Color } from '../../../utils/commons';
import {
  SeriesCollectionValue,
  getSeriesIndex,
  getSortedDataSeriesColorsValuesMap,
  getSeriesName,
} from '../utils/series';
import { SeriesKey, SeriesIdentifier } from '../../../commons/series_id';
import { AxisSpec, BasicSeriesSpec, Postfixes, isAreaSeriesSpec, isBarSeriesSpec } from '../utils/specs';
import { Y0_ACCESSOR_POSTFIX, Y1_ACCESSOR_POSTFIX } from '../tooltip/tooltip';
import { BandedAccessorType } from '../../../utils/geometry';
import { LegendItem } from '../../../commons/legend';

/** @internal */
export interface FormattedLastValues {
  y0: number | string | null;
  y1: number | string | null;
}

function getPostfix(spec: BasicSeriesSpec): Postfixes {
  if (isAreaSeriesSpec(spec) || isBarSeriesSpec(spec)) {
    const { y0AccessorFormat = Y0_ACCESSOR_POSTFIX, y1AccessorFormat = Y1_ACCESSOR_POSTFIX } = spec;
    return {
      y0AccessorFormat,
      y1AccessorFormat,
    };
  }

  return {};
}

/** @internal */
export function getBandedLegendItemLabel(name: string, yAccessor: BandedAccessorType, postfixes: Postfixes) {
  return yAccessor === BandedAccessorType.Y1
    ? `${name}${postfixes.y1AccessorFormat}`
    : `${name}${postfixes.y0AccessorFormat}`;
}

/** @internal */
export function computeLegend(
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>,
  seriesColors: Map<SeriesKey, Color>,
  specs: BasicSeriesSpec[],
  defaultColor: string,
  axesSpecs: AxisSpec[],
  deselectedDataSeries: SeriesIdentifier[] = [],
): LegendItem[] {
  const legendItems: LegendItem[] = [];
  const sortedCollection = getSortedDataSeriesColorsValuesMap(seriesCollection);

  sortedCollection.forEach((series, key) => {
    const { banded, lastValue, seriesIdentifier } = series;
    const spec = getSpecsById<BasicSeriesSpec>(specs, seriesIdentifier.specId);
    const color = seriesColors.get(key) || defaultColor;
    const hasSingleSeries = seriesCollection.size === 1;
    const name = getSeriesName(seriesIdentifier, hasSingleSeries, false, spec);
    const isSeriesHidden = deselectedDataSeries ? getSeriesIndex(deselectedDataSeries, seriesIdentifier) >= 0 : false;

    if (name === '' || !spec) {
      return;
    }
    const postFixes = getPostfix(spec);
    const labelY1 = banded ? getBandedLegendItemLabel(name, BandedAccessorType.Y1, postFixes) : name;

    // Use this to get axis spec w/ tick formatter
    const { yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);
    const formatter = yAxis ? yAxis.tickFormat : identity;
    const { hideInLegend } = spec;

    legendItems.push({
      color,
      label: labelY1,
      seriesIdentifier,
      childId: BandedAccessorType.Y1,
      isSeriesHidden,
      isItemHidden: hideInLegend,
      defaultExtra: {
        raw: lastValue && lastValue.y1 !== null ? lastValue.y1 : null,
        formatted: lastValue && lastValue.y1 !== null ? formatter(lastValue.y1) : null,
      },
    });
    if (banded) {
      const labelY0 = getBandedLegendItemLabel(name, BandedAccessorType.Y0, postFixes);
      legendItems.push({
        color,
        label: labelY0,
        seriesIdentifier,
        childId: BandedAccessorType.Y0,
        isSeriesHidden,
        isItemHidden: hideInLegend,
        defaultExtra: {
          raw: lastValue && lastValue.y0 !== null ? lastValue.y0 : null,
          formatted: lastValue && lastValue.y0 !== null ? formatter(lastValue.y0) : null,
        },
      });
    }
  });
  return legendItems;
}
