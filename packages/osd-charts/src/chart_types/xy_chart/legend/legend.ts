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

import { getAxesSpecForSpecId, LastValues, getSpecsById } from '../state/utils';
import { identity, Color } from '../../../utils/commons';
import {
  SeriesCollectionValue,
  getSeriesIndex,
  getSortedDataSeriesColorsValuesMap,
  getSeriesName,
  XYChartSeriesIdentifier,
  SeriesKey,
} from '../utils/series';
import { AxisSpec, BasicSeriesSpec, Postfixes, isAreaSeriesSpec, isBarSeriesSpec } from '../utils/specs';
import { Y0_ACCESSOR_POSTFIX, Y1_ACCESSOR_POSTFIX } from '../tooltip/tooltip';
import { BandedAccessorType } from '../../../utils/geometry';

interface FormattedLastValues {
  y0: number | string | null;
  y1: number | string | null;
}

export type LegendItem = Postfixes & {
  key: SeriesKey;
  color: Color;
  name: string;
  seriesIdentifier: XYChartSeriesIdentifier;
  isSeriesVisible?: boolean;
  banded?: boolean;
  isLegendItemVisible?: boolean;
  displayValue: {
    raw: LastValues;
    formatted: FormattedLastValues;
  };
};

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

export function getItemLabel(
  { banded, name, y1AccessorFormat, y0AccessorFormat }: LegendItem,
  yAccessor: BandedAccessorType,
) {
  if (!banded) {
    return name;
  }

  return yAccessor === BandedAccessorType.Y1 ? `${name}${y1AccessorFormat}` : `${name}${y0AccessorFormat}`;
}

export function computeLegend(
  seriesCollection: Map<SeriesKey, SeriesCollectionValue>,
  seriesColors: Map<SeriesKey, Color>,
  specs: BasicSeriesSpec[],
  defaultColor: string,
  axesSpecs: AxisSpec[],
  deselectedDataSeries: XYChartSeriesIdentifier[] = [],
): Map<SeriesKey, LegendItem> {
  const legendItems: Map<SeriesKey, LegendItem> = new Map();
  const sortedCollection = getSortedDataSeriesColorsValuesMap(seriesCollection);

  sortedCollection.forEach((series, key) => {
    const { banded, lastValue, seriesIdentifier } = series;
    const spec = getSpecsById<BasicSeriesSpec>(specs, seriesIdentifier.specId);
    const color = seriesColors.get(key) || defaultColor;
    const hasSingleSeries = seriesCollection.size === 1;
    const name = getSeriesName(seriesIdentifier, hasSingleSeries, false, spec);
    const isSeriesVisible = deselectedDataSeries ? getSeriesIndex(deselectedDataSeries, seriesIdentifier) < 0 : true;

    if (name === '' || !spec) {
      return;
    }

    // Use this to get axis spec w/ tick formatter
    const { yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);
    const formatter = yAxis ? yAxis.tickFormat : identity;
    const { hideInLegend } = spec;

    const legendItem: LegendItem = {
      key,
      color,
      name,
      banded,
      seriesIdentifier,
      isSeriesVisible,
      isLegendItemVisible: !hideInLegend,
      displayValue: {
        raw: {
          y0: lastValue && lastValue.y0 !== null ? lastValue.y0 : null,
          y1: lastValue && lastValue.y1 !== null ? lastValue.y1 : null,
        },
        formatted: {
          y0: lastValue && lastValue.y0 !== null ? formatter(lastValue.y0) : null,
          y1: lastValue && lastValue.y1 !== null ? formatter(lastValue.y1) : null,
        },
      },
      ...getPostfix(spec),
    };

    legendItems.set(key, legendItem);
  });
  return legendItems;
}
