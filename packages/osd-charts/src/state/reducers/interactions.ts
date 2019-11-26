import { InteractionsState } from '../chart_state';
import {
  ON_TOGGLE_LEGEND,
  ON_LEGEND_ITEM_OUT,
  ON_LEGEND_ITEM_OVER,
  ON_TOGGLE_DESELECT_SERIES,
  LegendActions,
} from '../actions/legend';
import { ON_MOUSE_DOWN, ON_MOUSE_UP, ON_POINTER_MOVE, MouseActions } from '../actions/mouse';
import { DataSeriesColorsValues, findDataSeriesByColorValues } from '../../chart_types/xy_chart/utils/series';

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
                      ...action.position,
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
  legendItem: DataSeriesColorsValues,
  deselectedDataSeries: DataSeriesColorsValues[],
) {
  const index = findDataSeriesByColorValues(deselectedDataSeries, legendItem);
  if (index > -1) {
    return [...deselectedDataSeries.slice(0, index), ...deselectedDataSeries.slice(index + 1)];
  } else {
    return [...deselectedDataSeries, legendItem];
  }
}
