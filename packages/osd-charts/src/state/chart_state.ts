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

import React, { RefObject } from 'react';

import { ChartTypes } from '../chart_types';
import { GoalState } from '../chart_types/goal_chart/state/chart_state';
import { HeatmapState } from '../chart_types/heatmap/state/chart_state';
import { PartitionState } from '../chart_types/partition_chart/state/chart_state';
import { XYAxisChartState } from '../chart_types/xy_chart/state/chart_state';
import { LegendItem, LegendItemExtraValues } from '../commons/legend';
import { SeriesKey, SeriesIdentifier } from '../commons/series_id';
import { TooltipInfo, TooltipAnchorPosition } from '../components/tooltip/types';
import { Spec, PointerEvent } from '../specs';
import { DEFAULT_SETTINGS_SPEC } from '../specs';
import { Color } from '../utils/commons';
import { Dimensions } from '../utils/dimensions';
import { Logger } from '../utils/logger';
import { Point } from '../utils/point';
import { StateActions } from './actions';
import { CHART_RENDERED } from './actions/chart';
import { UPDATE_PARENT_DIMENSION } from './actions/chart_settings';
import { SET_PERSISTED_COLOR, SET_TEMPORARY_COLOR, CLEAR_TEMPORARY_COLORS } from './actions/colors';
import { EXTERNAL_POINTER_EVENT } from './actions/events';
import { SPEC_PARSED, SPEC_UNMOUNTED, UPSERT_SPEC, REMOVE_SPEC } from './actions/specs';
import { interactionsReducer } from './reducers/interactions';
import { getInternalIsInitializedSelector, InitStatus } from './selectors/get_internal_is_intialized';
import { getLegendItemsSelector } from './selectors/get_legend_items';
import { LegendItemLabel } from './selectors/get_legend_items_labels';
import { DebugState } from './types';
import { getInitialPointerState } from './utils';

export type BackwardRef = () => React.RefObject<HTMLDivElement>;

/**
 * A set of chart-type-dependant functions that required by all chart type
 * @internal
 */
export interface InternalChartState {
  /**
   * The chart type
   */
  chartType: ChartTypes;
  isInitialized(globalState: GlobalChartState): InitStatus;
  /**
   * Returns a JSX element with the chart rendered (lenged excluded)
   * @param containerRef
   * @param forwardStageRef
   */
  chartRenderer(containerRef: BackwardRef, forwardStageRef: RefObject<HTMLCanvasElement>): JSX.Element | null;
  /**
   * `true` if the brush is available for this chart type
   * @param globalState
   */
  isBrushAvailable(globalState: GlobalChartState): boolean;
  /**
   * `true` if the brush is available for this chart type
   * @param globalState
   */
  isBrushing(globalState: GlobalChartState): boolean;
  /**
   * `true` if the chart is empty (no data displayed)
   * @param globalState
   */
  isChartEmpty(globalState: GlobalChartState): boolean;

  /**
   * Returns the list of legend items labels. Mainly used to compute the legend size
   * based on labels and their hierarchy depth.
   * @param globalState
   */
  getLegendItemsLabels(globalState: GlobalChartState): LegendItemLabel[];

  /**
   * Returns the list of legend items.
   * @param globalState
   */
  getLegendItems(globalState: GlobalChartState): LegendItem[];
  /**
   * Returns the list of extra values for each legend item
   * @param globalState
   */
  getLegendExtraValues(globalState: GlobalChartState): Map<SeriesKey, LegendItemExtraValues>;
  /**
   * Returns the CSS pointer cursor depending on the internal chart state
   * @param globalState
   */
  getPointerCursor(globalState: GlobalChartState): string;
  /**
   * Describe if the tooltip is visible and comes from an external source
   * @param globalState
   */
  isTooltipVisible(globalState: GlobalChartState): { visible: boolean; isExternal: boolean };
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

  /**
   * Called on every state change to activate any event callback
   * @param globalState
   */
  eventCallbacks(globalState: GlobalChartState): void;

  /**
   * Get the chart main projection area: exclude legends, axis and other external marks
   * @param globalState
   */
  getMainProjectionArea(globalState: GlobalChartState): Dimensions;

  /**
   * Get the chart container projection area
   * @param globalState
   */
  getProjectionContainerArea(globalState: GlobalChartState): Dimensions;

  /**
   * Get the brushed area if available
   * @param globalState
   */
  getBrushArea(globalState: GlobalChartState): Dimensions | null;

  /**
   * Get debug state of chart
   * @param globalState
   */
  getDebugState(globalState: GlobalChartState): DebugState;
}

/** @internal */
export interface SpecList {
  [specId: string]: Spec;
}

/** @internal */
export interface PointerState {
  position: Point;
  time: number;
}
/** @internal */
export interface DragState {
  start: PointerState;
  end: PointerState;
}

/** @internal */
export interface PointerStates {
  dragging: boolean;
  current: PointerState;
  down: PointerState | null;
  up: PointerState | null;
  lastDrag: DragState | null;
  lastClick: PointerState | null;
}

/** @internal */
export interface InteractionsState {
  pointer: PointerStates;
  highlightedLegendItemKey: string | null;
  legendCollapsed: boolean;
  deselectedDataSeries: SeriesIdentifier[];
}

/** @internal */
export interface ExternalEventsState {
  pointer: PointerEvent | null;
}

/** @internal */
export interface ColorOverrides {
  temporary: Record<SeriesKey, Color | null>;
  persisted: Record<SeriesKey, Color>;
}

/** @internal */
export interface GlobalChartState {
  /**
   * a unique ID for each chart used by re-reselect to memoize selector per chart
   */
  chartId: string;
  /**
   * true when all all the specs are parsed ad stored into the specs object
   */
  specsInitialized: boolean;
  specParsing: boolean;
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

/** @internal */
export const getInitialState = (chartId: string): GlobalChartState => ({
  chartId,
  specsInitialized: false,
  specParsing: false,
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
    pointer: getInitialPointerState(),
    legendCollapsed: false,
    highlightedLegendItemKey: null,
    deselectedDataSeries: [],
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

/** @internal */
export const chartStoreReducer = (chartId: string) => {
  const initialState = getInitialState(chartId);
  return (state = initialState, action: StateActions): GlobalChartState => {
    switch (action.type) {
      case SPEC_PARSED:
        const chartType = findMainChartType(state.specs);

        if (isChartTypeChanged(state, chartType)) {
          const internalChartState = initInternalChartState(chartType);
          return {
            ...state,
            specsInitialized: true,
            specParsing: false,
            chartType,
            internalChartState,
          };
        }
        return {
          ...state,
          specsInitialized: true,
          specParsing: false,
          chartType,
        };

      case SPEC_UNMOUNTED:
        return {
          ...state,
          specsInitialized: false,
          chartRendered: false,
        };
      case UPSERT_SPEC:
        if (!state.specParsing) {
          return {
            ...state,
            specsInitialized: false,
            chartRendered: false,
            specParsing: true,
            specs: {
              [DEFAULT_SETTINGS_SPEC.id]: DEFAULT_SETTINGS_SPEC,
              [action.spec.id]: action.spec,
            },
          };
        }
        return {
          ...state,
          specsInitialized: false,
          chartRendered: false,
          specs: {
            ...state.specs,
            [action.spec.id]: action.spec,
          },
        };
      case REMOVE_SPEC:
        const { [action.id]: specToRemove, ...rest } = state.specs;
        return {
          ...state,
          specsInitialized: false,
          chartRendered: false,
          specParsing: false,
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
            persisted:
              action.color !== null
                ? {
                    ...state.colors.persisted,
                    [action.key]: action.color,
                  }
                : (() => {
                    const { [action.key]: removed, ...others } = state.colors.persisted;
                    return others;
                  })(),
          },
        };
      default:
        if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
          return state;
        }
        return {
          ...state,
          interactions: interactionsReducer(state.interactions, action, getLegendItemsSelector(state)),
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
    Logger.warn('Multiple chart type on the same configuration');
    return null;
  }
  return chartTypes[0] as ChartTypes;
}

function initInternalChartState(chartType: ChartTypes | null): InternalChartState | null {
  switch (chartType) {
    case ChartTypes.Goal:
      return new GoalState();
    case ChartTypes.Partition:
      return new PartitionState();
    case ChartTypes.XYAxis:
      return new XYAxisChartState();
    case ChartTypes.Heatmap:
      return new HeatmapState();
    default:
      return null;
  }
}

function isChartTypeChanged(state: GlobalChartState, newChartType: ChartTypes | null) {
  return state.chartType !== newChartType;
}
