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

import { SPEC_PARSED, SPEC_UNMOUNTED, UPSERT_SPEC, REMOVE_SPEC, SPEC_PARSING } from './actions/specs';
import { SET_PERSISTED_COLOR, SET_TEMPORARY_COLOR, CLEAR_TEMPORARY_COLORS } from './actions/colors';
import { interactionsReducer } from './reducers/interactions';
import { ChartTypes } from '../chart_types';
import { XYAxisChartState } from '../chart_types/xy_chart/state/chart_state';
import { XYChartSeriesIdentifier, SeriesKey } from '../chart_types/xy_chart/utils/series';
import { Spec, PointerEvent } from '../specs';
import { DEFAULT_SETTINGS_SPEC } from '../specs/settings';
import { Dimensions } from '../utils/dimensions';
import { Point } from '../utils/point';
import { LegendItem } from '../chart_types/xy_chart/legend/legend';
import { TooltipLegendValue } from '../chart_types/xy_chart/tooltip/tooltip';
import { StateActions } from './actions';
import { CHART_RENDERED } from './actions/chart';
import { UPDATE_PARENT_DIMENSION } from './actions/chart_settings';
import { EXTERNAL_POINTER_EVENT } from './actions/events';
import { RefObject } from 'react';
import { PartitionState } from '../chart_types/partition_chart/state/chart_state';
import { TooltipInfo } from '../components/tooltip/types';
import { TooltipAnchorPosition } from '../components/tooltip/utils';
import { Color } from '../utils/commons';

export type BackwardRef = () => React.RefObject<HTMLDivElement>;

/**
 * A set of chart-type-dependant functions that are required and called
 * globally by the <ChartContainer> and
 */
export interface InternalChartState {
  /**
   * the chart type
   */
  chartType: ChartTypes;
  /**
   * returns a JSX element with the chart rendered (lenged excluded)
   * @param containerRef
   * @param forwardStageRef
   */
  chartRenderer(containerRef: BackwardRef, forwardStageRef: RefObject<HTMLCanvasElement>): JSX.Element | null;
  /**
   * true if the brush is available for this chart type
   * @param globalState
   */
  isBrushAvailable(globalState: GlobalChartState): boolean;
  /**
   * true if the brush is available for this chart type
   * @param globalState
   */
  isBrushing(globalState: GlobalChartState): boolean;
  /**
   * true if the chart is empty (no data displayed)
   * @param globalState
   */
  isChartEmpty(globalState: GlobalChartState): boolean;
  /**
   * return the list of legend items
   * @param globalState
   */
  getLegendItems(globalState: GlobalChartState): Map<SeriesKey, LegendItem>;
  /**
   * return the list of values for each legend item
   * @param globalState
   */
  getLegendItemsValues(globalState: GlobalChartState): Map<SeriesKey, TooltipLegendValue>;
  /**
   * return the CSS pointer cursor depending on the internal chart state
   * @param globalState
   */
  getPointerCursor(globalState: GlobalChartState): string;
  /**
   * true if the tooltip is visible, false otherwise
   * @param globalState
   */
  isTooltipVisible(globalState: GlobalChartState): boolean;
  /**
   * Get the tooltip information to display
   * @param globalState the GlobalChartState
   */
  getTooltipInfo(globalState: GlobalChartState): TooltipInfo | undefined;

  /**
   * Get the tooltip anchor position
   * @param globalState
   */
  getTooltipAnchor(globalState: GlobalChartState): TooltipAnchorPosition | null;
}

export interface SpecList {
  [specId: string]: Spec;
}

export interface PointerState {
  position: Point;
  time: number;
}
export interface DragState {
  start: PointerState;
  end: PointerState;
}
export interface PointerStates {
  dragging: boolean;
  current: PointerState;
  down: PointerState | null;
  up: PointerState | null;
  lastDrag: DragState | null;
  lastClick: PointerState | null;
}

export interface InteractionsState {
  pointer: PointerStates;
  highlightedLegendItemKey: string | null;
  legendCollapsed: boolean;
  invertDeselect: boolean;
  deselectedDataSeries: XYChartSeriesIdentifier[];
}

export interface ExternalEventsState {
  pointer: PointerEvent | null;
}

export interface ColorOverrides {
  temporary: Record<SeriesKey, Color>;
  persisted: Record<SeriesKey, Color>;
}

export interface GlobalChartState {
  /**
   * a unique ID for each chart used by re-reselect to memoize selector per chart
   */
  chartId: string;
  /**
   * true when all all the specs are parsed ad stored into the specs object
   */
  specsInitialized: boolean;
  /**
   * true if the chart is rendered on dom
   */
  chartRendered: boolean;
  /**
   * incremental count of the chart rendering
   */
  chartRenderedCount: number;
  /**
   * the map of parsed specs
   */
  specs: SpecList;
  /**
   * the chart type depending on the used specs
   */
  chartType: ChartTypes | null;
  /**
   * a chart-type-dependant class that is used to render and share chart-type dependant functions
   */
  internalChartState: InternalChartState | null;
  /**
   * the dimensions of the parent container, including the legend
   */
  parentDimensions: Dimensions;
  /**
   * the state of the interactions
   */
  interactions: InteractionsState;
  /**
   * external event state
   */
  externalEvents: ExternalEventsState;
  /**
   * Color map used to persist color picker changes
   */
  colors: ColorOverrides;
}

export const getInitialState = (chartId: string): GlobalChartState => ({
  chartId,
  specsInitialized: false,
  chartRendered: false,
  chartRenderedCount: 0,
  specs: {
    [DEFAULT_SETTINGS_SPEC.id]: DEFAULT_SETTINGS_SPEC,
  },
  colors: {
    temporary: {},
    persisted: {},
  },
  chartType: null,
  internalChartState: null,
  interactions: {
    pointer: {
      dragging: false,
      current: {
        position: {
          x: -1,
          y: -1,
        },
        time: 0,
      },
      down: null,
      up: null,
      lastDrag: null,
      lastClick: null,
    },
    legendCollapsed: false,
    highlightedLegendItemKey: null,
    deselectedDataSeries: [],
    invertDeselect: false,
  },
  externalEvents: {
    pointer: null,
  },
  parentDimensions: {
    height: 0,
    width: 0,
    left: 0,
    top: 0,
  },
});

export const chartStoreReducer = (chartId: string) => {
  const initialState = getInitialState(chartId);
  return (state = initialState, action: StateActions): GlobalChartState => {
    switch (action.type) {
      case SPEC_PARSING:
        return {
          ...state,
          specsInitialized: false,
          chartRendered: false,
          specs: {
            [DEFAULT_SETTINGS_SPEC.id]: DEFAULT_SETTINGS_SPEC,
          },
        };
      case SPEC_PARSED:
        const chartType = findMainChartType(state.specs);

        if (isChartTypeChanged(state, chartType)) {
          const internalChartState = initInternalChartState(chartType);
          return {
            ...state,
            specsInitialized: true,
            chartType,
            internalChartState,
          };
        } else {
          return {
            ...state,
            specsInitialized: true,
            chartType,
          };
        }
      case SPEC_UNMOUNTED:
        return {
          ...state,
          specsInitialized: false,
          chartRendered: false,
        };
      case UPSERT_SPEC:
        return {
          ...state,
          specs: {
            ...state.specs,
            [action.spec.id]: action.spec,
          },
        };
      case REMOVE_SPEC:
        const { [action.id]: specToRemove, ...rest } = state.specs;
        return {
          ...state,
          specs: {
            ...rest,
          },
        };
      case CHART_RENDERED:
        const count = state.chartRendered ? state.chartRenderedCount : state.chartRenderedCount + 1;
        return {
          ...state,
          chartRendered: true,
          chartRenderedCount: count,
        };
      case UPDATE_PARENT_DIMENSION:
        return {
          ...state,
          parentDimensions: {
            ...action.dimensions,
          },
        };
      case EXTERNAL_POINTER_EVENT:
        // discard events from self if any
        if (action.event.chartId === chartId) {
          return {
            ...state,
            externalEvents: {
              ...state.externalEvents,
              pointer: null,
            },
          };
        }
        return {
          ...state,
          externalEvents: {
            ...state.externalEvents,
            pointer: {
              ...action.event,
            },
          },
        };
      case CLEAR_TEMPORARY_COLORS:
        return {
          ...state,
          colors: {
            ...state.colors,
            temporary: {},
          },
        };
      case SET_TEMPORARY_COLOR:
        return {
          ...state,
          colors: {
            ...state.colors,
            temporary: {
              ...state.colors.temporary,
              [action.key]: action.color,
            },
          },
        };
      case SET_PERSISTED_COLOR:
        return {
          ...state,
          colors: {
            ...state.colors,
            persisted: {
              ...state.colors.persisted,
              [action.key]: action.color,
            },
          },
        };
      default:
        return {
          ...state,
          interactions: interactionsReducer(state.interactions, action),
        };
    }
  };
};

function findMainChartType(specs: SpecList): ChartTypes | null {
  const types: Partial<Record<ChartTypes, number>> = Object.keys(specs).reduce<Partial<Record<ChartTypes, number>>>(
    (acc, specId) => {
      const { chartType } = specs[specId];
      let accumulator = acc[chartType];
      if (accumulator === undefined) {
        accumulator = 0;
      } else {
        accumulator += 1;
      }
      acc[chartType] = accumulator;
      return acc;
    },
    {},
  );
  // https://stackoverflow.com/questions/55012174/why-doesnt-object-keys-return-a-keyof-type-in-typescript
  const chartTypes = Object.keys(types).filter((type) => type !== ChartTypes.Global);
  if (chartTypes.length > 1) {
    // eslint-disable-next-line no-console
    console.warn('Multiple chart type on the same configuration');
    return null;
  } else {
    return chartTypes[0] as ChartTypes;
  }
}

function initInternalChartState(chartType: ChartTypes | null): InternalChartState | null {
  switch (chartType) {
    case ChartTypes.Partition:
      return new PartitionState();
    case ChartTypes.XYAxis:
      return new XYAxisChartState();
    default:
      return null;
  }
}

function isChartTypeChanged(state: GlobalChartState, newChartType: ChartTypes | null) {
  return state.chartType !== newChartType;
}
