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

import createCachedSelector from 're-reselect';

import { LegendItem } from '../../../../commons/legend';
import { AxisSpec } from '../../../../specs';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import {
  DebugState,
  DebugStateValue,
  DebugStateAxes,
  DebugStateArea,
  DebugStateLine,
  DebugStateBar,
  DebugStateLegend,
} from '../../../../state/types';
import { AreaGeometry, BandedAccessorType, LineGeometry, BarGeometry } from '../../../../utils/geometry';
import { FillStyle, Visible, StrokeStyle, Opacity } from '../../../../utils/themes/theme';
import { isVerticalAxis } from '../../utils/axis_type_utils';
import { computeAxisVisibleTicksSelector, AxisVisibleTicks } from './compute_axis_visible_ticks';
import { computeLegendSelector } from './compute_legend';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { getAxisSpecsSelector } from './get_specs';

/**
 * Returns a stringified version of the `debugState`
 * @internal
 */
export const getDebugStateSelector = createCachedSelector(
  [computeSeriesGeometriesSelector, computeLegendSelector, computeAxisVisibleTicksSelector, getAxisSpecsSelector],
  ({ geometries }, legend, axes, axesSpecs): DebugState => {
    const seriesNameMap = getSeriesNameMap(legend);

    return {
      legend: getLegendState(legend),
      axes: getAxes(axes, axesSpecs),
      areas: geometries.areas.map(getAreaState(seriesNameMap)),
      lines: geometries.lines.map(getLineState(seriesNameMap)),
      bars: getBarsState(seriesNameMap, geometries.bars),
    };
  },
)(getChartIdSelector);

const getAxes = (ticks: AxisVisibleTicks, axesSpecs: AxisSpec[]): DebugStateAxes | undefined => {
  if (axesSpecs.length === 0) {
    return;
  }

  return axesSpecs.reduce<DebugStateAxes>(
    (acc, { position, title, id }) => {
      const axisTicks = ticks.axisVisibleTicks.get(id) ?? [];
      const labels = axisTicks.map(({ label }) => label);
      const values = axisTicks.map(({ value }) => value);
      const grids = ticks.axisGridLinesPositions.get(id) ?? [];
      const gridlines = grids.map(([x, y]) => ({ x, y }));

      if (isVerticalAxis(position)) {
        acc.y.push({
          id,
          title,
          position,
          // reverse for bottom/up coordinates
          labels: labels.reverse(),
          values: values.reverse(),
          gridlines: gridlines.reverse(),
        });
      } else {
        acc.x.push({
          id,
          title,
          position,
          labels,
          values,
          gridlines,
        });
      }

      return acc;
    },
    {
      y: [],
      x: [],
    },
  );
};

const getBarsState = (seriesNameMap: Map<string, string>, barGeometries: BarGeometry[]): DebugStateBar[] => {
  const buckets = new Map<string, DebugStateBar>();

  barGeometries.forEach(
    ({
      color,
      seriesIdentifier: { key },
      seriesStyle: { rect, rectBorder },
      value: { x, y, mark },
      displayValue,
    }: BarGeometry) => {
      const label = displayValue?.text;
      const name = seriesNameMap.get(key) ?? '';
      const bucket: DebugStateBar = buckets.get(key) ?? {
        key,
        name,
        color,
        bars: [],
        labels: [],
        visible: hasVisibleStyle(rect) || hasVisibleStyle(rectBorder),
      };

      bucket.bars.push({ x, y, mark });

      if (label) {
        bucket.labels.push(label);
      }

      buckets.set(key, bucket);

      return buckets;
    },
  );

  return [...buckets.values()];
};

const getLineState = (seriesNameMap: Map<string, string>) => ({
  line: path,
  points,
  color,
  seriesIdentifier: { key },
  seriesLineStyle,
  seriesPointStyle,
}: LineGeometry): DebugStateLine => {
  const name = seriesNameMap.get(key) ?? '';

  return {
    path,
    color,
    key,
    name,
    visible: hasVisibleStyle(seriesLineStyle),
    visiblePoints: hasVisibleStyle(seriesPointStyle),
    points: points.map(({ value: { x, y, mark } }) => ({ x, y, mark })),
  };
};

const getAreaState = (seriesNameMap: Map<string, string>) => ({
  area: path,
  lines,
  points,
  color,
  seriesIdentifier: { key },
  seriesAreaStyle,
  seriesPointStyle,
  seriesAreaLineStyle,
}: AreaGeometry): DebugStateArea => {
  const [y1Path, y0Path] = lines;
  const linePoints = points.reduce<{
    y0: DebugStateValue[];
    y1: DebugStateValue[];
  }>(
    (acc, { value: { accessor, ...value } }) => {
      if (accessor === BandedAccessorType.Y0) {
        acc.y0.push(value);
      } else {
        acc.y1.push(value);
      }

      return acc;
    },
    {
      y0: [],
      y1: [],
    },
  );
  const lineVisible = hasVisibleStyle(seriesAreaLineStyle);
  const visiblePoints = hasVisibleStyle(seriesPointStyle);
  const name = seriesNameMap.get(key) ?? '';

  return {
    path,
    color,
    key,
    name,
    visible: hasVisibleStyle(seriesAreaStyle),
    lines: {
      y0: y0Path
        ? {
            visible: lineVisible,
            path: y0Path,
            points: linePoints.y0,
            visiblePoints,
          }
        : undefined,
      y1: {
        visible: lineVisible,
        path: y1Path,
        points: linePoints.y1,
        visiblePoints,
      },
    },
  };
};

/**
 * returns series key to name mapping
 */
function getSeriesNameMap(legendItems: LegendItem[]): Map<string, string> {
  return legendItems.reduce((acc, { label: name, seriesIdentifier: { key } }) => {
    acc.set(key, name);
    return acc;
  }, new Map<string, string>());
}

function getLegendState(legendItems: LegendItem[]): DebugStateLegend {
  const items = legendItems
    .filter(({ isSeriesHidden }) => !isSeriesHidden)
    .map(({ label: name, color, seriesIdentifier: { key } }) => ({
      key,
      name,
      color,
    }));

  return { items };
}

/**
 * Returns true for styles if they are visible
 * Serves as a catchall for multiple style types
 */
function hasVisibleStyle({
  visible = true,
  fill = '#fff',
  stroke = '#fff',
  strokeWidth = 1,
  opacity = 1,
}: Partial<StrokeStyle & Visible & FillStyle & Opacity>): boolean {
  return Boolean(visible && opacity > 0 && strokeWidth > 0 && fill && stroke);
}
