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

import createCachedSelector from 're-reselect';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { Point } from '../../../../utils/point';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { ComputedScales, getAxesSpecForSpecId, getSpecsById } from '../utils';
import { getComputedScalesSelector } from './get_computed_scales';
import { getElementAtCursorPositionSelector } from './get_elements_at_cursor_pos';
import { IndexedGeometry } from '../../../../utils/geometry';
import { getSeriesSpecsSelector, getAxisSpecsSelector } from './get_specs';
import { BasicSeriesSpec, AxisSpec } from '../../utils/specs';
import { Rotation } from '../../../../utils/commons';
import { getTooltipTypeSelector } from './get_tooltip_type';
import { formatTooltip } from '../../tooltip/tooltip';
import { getTooltipHeaderFormatterSelector } from '../../../../state/selectors/get_tooltip_header_formatter';
import { isPointOnGeometry } from '../../rendering/rendering';
import { GlobalChartState } from '../../../../state/chart_state';
import {
  PointerEvent,
  isPointerOutEvent,
  TooltipValue,
  TooltipType,
  TooltipValueFormatter,
  isFollowTooltipType,
} from '../../../../specs';
import { isValidPointerOverEvent } from '../../../../utils/events';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { hasSingleSeriesSelector } from './has_single_series';
import { TooltipInfo } from '../../../../components/tooltip/types';

const EMPTY_VALUES = Object.freeze({
  tooltip: {
    header: null,
    values: [],
  },
  highlightedGeometries: [],
});

export interface TooltipAndHighlightedGeoms {
  tooltip: TooltipInfo;
  highlightedGeometries: IndexedGeometry[];
}

const getExternalPointerEventStateSelector = (state: GlobalChartState) => state.externalEvents.pointer;

export const getTooltipInfoAndGeometriesSelector = createCachedSelector(
  [
    getSeriesSpecsSelector,
    getAxisSpecsSelector,
    getProjectedPointerPositionSelector,
    getOrientedProjectedPointerPositionSelector,
    getChartRotationSelector,
    hasSingleSeriesSelector,
    getComputedScalesSelector,
    getElementAtCursorPositionSelector,
    getTooltipTypeSelector,
    getExternalPointerEventStateSelector,
    getTooltipHeaderFormatterSelector,
  ],
  getTooltipAndHighlightFromXValue,
)((state: GlobalChartState) => {
  return state.chartId;
});

function getTooltipAndHighlightFromXValue(
  seriesSpecs: BasicSeriesSpec[],
  axesSpecs: AxisSpec[],
  projectedPointerPosition: Point,
  orientedProjectedPointerPosition: Point,
  chartRotation: Rotation,
  hasSingleSeries: boolean,
  scales: ComputedScales,
  xMatchingGeoms: IndexedGeometry[],
  tooltipType: TooltipType = TooltipType.VerticalCursor,
  externalPointerEvent: PointerEvent | null,
  tooltipHeaderFormatter?: TooltipValueFormatter,
): TooltipAndHighlightedGeoms {
  if (!scales.xScale || !scales.yScales) {
    return EMPTY_VALUES;
  }
  if (tooltipType === TooltipType.None) {
    return EMPTY_VALUES;
  }
  let x = orientedProjectedPointerPosition.x;
  let y = orientedProjectedPointerPosition.y;
  if (isValidPointerOverEvent(scales.xScale, externalPointerEvent)) {
    x = scales.xScale.pureScale(externalPointerEvent.value);
    y = 0;
  } else if (projectedPointerPosition.x === -1 || projectedPointerPosition.y === -1) {
    return EMPTY_VALUES;
  }

  if (xMatchingGeoms.length === 0) {
    return EMPTY_VALUES;
  }

  // build the tooltip value list
  let header: TooltipValue | null = null;
  const highlightedGeometries: IndexedGeometry[] = [];
  const values = xMatchingGeoms
    .filter(({ value: { y } }) => y !== null)
    .reduce<TooltipValue[]>((acc, indexedGeometry) => {
      const {
        seriesIdentifier: { specId },
      } = indexedGeometry;
      const spec = getSpecsById<BasicSeriesSpec>(seriesSpecs, specId);

      // safe guard check
      if (!spec) {
        return acc;
      }
      const { xAxis, yAxis } = getAxesSpecForSpecId(axesSpecs, spec.groupId);

      // yScales is ensured by the enclosing if
      const yScale = scales.yScales.get(spec.groupId);
      if (!yScale) {
        return acc;
      }

      // check if the pointer is on the geometry (avoid checking if using external pointer event)
      let isHighlighted = false;
      if (
        (!externalPointerEvent || isPointerOutEvent(externalPointerEvent)) &&
        isPointOnGeometry(x, y, indexedGeometry)
      ) {
        isHighlighted = true;
        highlightedGeometries.push(indexedGeometry);
      }

      // if it's a follow tooltip, and no element is highlighted
      // not add that element into the tooltip list
      if (!isHighlighted && isFollowTooltipType(tooltipType)) {
        return acc;
      }

      // format the tooltip values
      const yAxisFormatSpec = [0, 180].includes(chartRotation) ? yAxis : xAxis;
      const formattedTooltip = formatTooltip(
        indexedGeometry,
        spec,
        false,
        isHighlighted,
        hasSingleSeries,
        yAxisFormatSpec,
      );

      // format only one time the x value
      if (!header) {
        // if we have a tooltipHeaderFormatter, then don't pass in the xAxis as the user will define a formatter
        const xAxisFormatSpec = [0, 180].includes(chartRotation) ? xAxis : yAxis;
        const formatterAxis = tooltipHeaderFormatter ? undefined : xAxisFormatSpec;
        header = formatTooltip(indexedGeometry, spec, true, false, hasSingleSeries, formatterAxis);
      }

      return [...acc, formattedTooltip];
    }, []);

  return {
    tooltip: {
      header,
      values,
    },
    highlightedGeometries,
  };
}

export const getTooltipInfoSelector = createCachedSelector(
  [getTooltipInfoAndGeometriesSelector],
  ({ tooltip }): TooltipInfo => {
    return tooltip;
  },
)(getChartIdSelector);

export const getHighlightedGeomsSelector = createCachedSelector(
  [getTooltipInfoAndGeometriesSelector],
  (values): IndexedGeometry[] => {
    return values.highlightedGeometries;
  },
)(getChartIdSelector);
