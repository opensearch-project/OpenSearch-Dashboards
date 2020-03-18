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

import { InteractionsState } from '../chart_state';
import {
  ON_TOGGLE_LEGEND,
  ON_LEGEND_ITEM_OUT,
  ON_LEGEND_ITEM_OVER,
  ON_TOGGLE_DESELECT_SERIES,
  LegendActions,
} from '../actions/legend';
import { ON_MOUSE_DOWN, ON_MOUSE_UP, ON_POINTER_MOVE, MouseActions } from '../actions/mouse';
import { getSeriesIndex, XYChartSeriesIdentifier } from '../../chart_types/xy_chart/utils/series';

/** @internal */
export function interactionsReducer(state: InteractionsState, action: LegendActions | MouseActions): InteractionsState {
  switch (action.type) {
    case ON_POINTER_MOVE:
      return {
        ...state,
        pointer: {
          ...state.pointer,
          dragging: state.pointer.down && state.pointer.down.time < action.time ? true : false,
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
    case ON_TOGGLE_LEGEND:
      return {
        ...state,
        legendCollapsed: !state.legendCollapsed,
      };
    case ON_LEGEND_ITEM_OUT:
      return {
        ...state,
        highlightedLegendItemKey: null,
      };
    case ON_LEGEND_ITEM_OVER:
      return {
        ...state,
        highlightedLegendItemKey: action.legendItemKey,
      };
    case ON_TOGGLE_DESELECT_SERIES:
      return {
        ...state,
        deselectedDataSeries: toggleDeselectedDataSeries(action.legendItemId, state.deselectedDataSeries),
      };
    default:
      return state;
  }
}

function toggleDeselectedDataSeries(
  legendItem: XYChartSeriesIdentifier,
  deselectedDataSeries: XYChartSeriesIdentifier[],
) {
  const index = getSeriesIndex(deselectedDataSeries, legendItem);
  if (index > -1) {
    return [...deselectedDataSeries.slice(0, index), ...deselectedDataSeries.slice(index + 1)];
  } else {
    return [...deselectedDataSeries, legendItem];
  }
}
