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

import { ChartTypes } from '../../chart_types';
import { getPickedShapesLayerValues } from '../../chart_types/partition_chart/state/selectors/picked_shapes';
import { getSeriesIndex } from '../../chart_types/xy_chart/utils/series';
import { LegendItem } from '../../common/legend';
import { SeriesIdentifier } from '../../common/series_id';
import { LayerValue } from '../../specs';
import { getDelta } from '../../utils/point';
import { DOMElementActions, ON_DOM_ELEMENT_ENTER, ON_DOM_ELEMENT_LEAVE } from '../actions/dom_element';
import { KeyActions, ON_KEY_UP } from '../actions/key';
import {
  LegendActions,
  ON_LEGEND_ITEM_OUT,
  ON_LEGEND_ITEM_OVER,
  ON_TOGGLE_DESELECT_SERIES,
  ToggleDeselectSeriesAction,
} from '../actions/legend';
import { MouseActions, ON_MOUSE_DOWN, ON_MOUSE_UP, ON_POINTER_MOVE } from '../actions/mouse';
import { GlobalChartState, InteractionsState } from '../chart_state';
import { getInitialPointerState } from '../utils';

/**
 * The minimum amount of time to consider for for dragging purposes
 * @internal
 */
export const DRAG_DETECTION_TIMEOUT = 100;
/**
 * The minimum number of pixel between two pointer positions to consider for dragging purposes
 */
const DRAG_DETECTION_PIXEL_DELTA = 4;

/** @internal */
export function interactionsReducer(
  globalState: GlobalChartState,
  action: LegendActions | MouseActions | KeyActions | DOMElementActions,
  legendItems: LegendItem[],
): InteractionsState {
  const { interactions: state } = globalState;
  switch (action.type) {
    case ON_KEY_UP:
      if (action.key === 'Escape') {
        return {
          ...state,
          pointer: getInitialPointerState(),
        };
      }

      return state;

    case ON_POINTER_MOVE:
      // enable the dragging flag only if the pixel delta between down and move is greater then 4 pixel
      const dragging =
        !!state.pointer.down && getDelta(state.pointer.down.position, action.position) > DRAG_DETECTION_PIXEL_DELTA;
      return {
        ...state,
        pointer: {
          ...state.pointer,
          dragging,
          current: {
            position: {
              ...action.position,
            },
            time: action.time,
          },
        },
      };
    case ON_MOUSE_DOWN:
      return {
        ...state,
        drilldown: getDrilldownData(globalState),
        pointer: {
          ...state.pointer,
          dragging: false,
          up: null,
          down: {
            position: {
              ...action.position,
            },
            time: action.time,
          },
        },
      };
    case ON_MOUSE_UP: {
      return {
        ...state,
        pointer: {
          ...state.pointer,
          lastDrag:
            state.pointer.down && state.pointer.dragging
              ? {
                  start: {
                    position: {
                      ...state.pointer.down.position,
                    },
                    time: state.pointer.down.time,
                  },
                  end: {
                    position: {
                      ...state.pointer.current.position,
                    },
                    time: action.time,
                  },
                }
              : null,
          lastClick:
            state.pointer.down && !state.pointer.dragging
              ? {
                  position: {
                    ...action.position,
                  },
                  time: action.time,
                }
              : null,
          dragging: false,
          down: null,
          up: {
            position: {
              ...action.position,
            },
            time: action.time,
          },
        },
      };
    }
    case ON_LEGEND_ITEM_OUT:
      return {
        ...state,
        highlightedLegendItemKey: null,
        highlightedLegendPath: [],
      };
    case ON_LEGEND_ITEM_OVER:
      const { legendItemKey: highlightedLegendItemKey, legendPath: highlightedLegendPath } = action;
      return {
        ...state,
        highlightedLegendItemKey,
        highlightedLegendPath,
      };
    case ON_TOGGLE_DESELECT_SERIES:
      return {
        ...state,
        deselectedDataSeries: toggleDeselectedDataSeries(action, state.deselectedDataSeries, legendItems),
      };

    case ON_DOM_ELEMENT_ENTER:
      return {
        ...state,
        hoveredDOMElement: action.element,
      };
    case ON_DOM_ELEMENT_LEAVE:
      return {
        ...state,
        hoveredDOMElement: null,
      };
    default:
      return state;
  }
}

/**
 * Helper functions that currently depend on chart type eg. xy or partition
 */

function toggleDeselectedDataSeries(
  { legendItemId: id, negate }: ToggleDeselectSeriesAction,
  deselectedDataSeries: SeriesIdentifier[],
  legendItems: LegendItem[],
) {
  if (negate) {
    const hidden = getSeriesIndex(deselectedDataSeries, id) > -1;

    if (!hidden && deselectedDataSeries.length === legendItems.length - 1) {
      return [id];
    }

    const items = legendItems.map(({ seriesIdentifier: si }) => si);
    const index = getSeriesIndex(items, id);

    return [...items.slice(0, index), ...items.slice(index + 1)];
  }

  const index = getSeriesIndex(deselectedDataSeries, id);
  if (index > -1) {
    return [...deselectedDataSeries.slice(0, index), ...deselectedDataSeries.slice(index + 1)];
  }
  return [...deselectedDataSeries, id];
}

function getDrilldownData(globalState: GlobalChartState) {
  if (globalState.chartType !== ChartTypes.Partition) {
    return [];
  }
  const layerValues: LayerValue[] = getPickedShapesLayerValues(globalState)[0];
  return layerValues ? layerValues[layerValues.length - 1].path.map((n) => n.value) : [];
}
