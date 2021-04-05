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

import { RGBtoString } from '../../../../common/color_library_wrappers';
import { LegendItem } from '../../../../common/legend';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { DebugState, DebugStateLegend } from '../../../../state/types';
import { Position } from '../../../../utils/common';
import { computeLegendSelector } from './compute_legend';
import { geometries } from './geometries';
import { getHighlightedAreaSelector, getHighlightedDataSelector } from './get_highlighted_area';
import { getPickedCells } from './get_picked_cells';

/**
 * Returns a stringified version of the `debugState`
 * @internal
 */
export const getDebugStateSelector = createCachedSelector(
  [geometries, computeLegendSelector, getHighlightedAreaSelector, getPickedCells, getHighlightedDataSelector],
  (geoms, legend, pickedArea, pickedCells, highlightedData): DebugState => {
    return {
      // Common debug state
      legend: getLegendState(legend),
      axes: {
        x: [
          {
            id: 'x',
            position: Position.Left,
            labels: geoms.heatmapViewModel.xValues.map(({ text }) => text),
            values: geoms.heatmapViewModel.xValues.map(({ value }) => value),
            // vertical lines
            gridlines: geoms.heatmapViewModel.gridLines.x.map((line) => ({ x: line.x1, y: line.y2 })),
          },
        ],
        y: [
          {
            id: 'y',
            position: Position.Bottom,
            labels: geoms.heatmapViewModel.yValues.map(({ text }) => text),
            values: geoms.heatmapViewModel.yValues.map(({ value }) => value),
            // horizontal lines
            gridlines: geoms.heatmapViewModel.gridLines.y.map((line) => ({ x: line.x2, y: line.y1 })),
          },
        ],
      },
      // Heatmap debug state
      heatmap: {
        cells: geoms.heatmapViewModel.cells.map(({ x, y, fill, formatted, value }) => ({
          x,
          y,
          fill: RGBtoString(fill.color),
          formatted,
          value,
        })),
        selection: {
          area: pickedArea,
          data: highlightedData,
        },
      },
    };
  },
)(getChartIdSelector);

function getLegendState(legendItems: LegendItem[]): DebugStateLegend {
  const items = legendItems
    .filter(({ isSeriesHidden }) => !isSeriesHidden)
    .map(({ label: name, color, seriesIdentifiers: [{ key }] }) => ({
      key,
      name,
      color,
    }));

  return { items };
}
