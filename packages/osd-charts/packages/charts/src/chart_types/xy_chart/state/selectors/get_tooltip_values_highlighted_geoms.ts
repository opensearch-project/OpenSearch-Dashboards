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

import { TooltipInfo } from '../../../../components/tooltip/types';
import {
  PointerEvent,
  isPointerOutEvent,
  TooltipValue,
  TooltipValueFormatter,
  isFollowTooltipType,
  SettingsSpec,
  getTooltipType,
} from '../../../../specs';
import { TooltipType } from '../../../../specs/constants';
import { GlobalChartState } from '../../../../state/chart_state';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { getSettingsSpecSelector } from '../../../../state/selectors/get_settings_specs';
import { getTooltipHeaderFormatterSelector } from '../../../../state/selectors/get_tooltip_header_formatter';
import { Rotation } from '../../../../utils/common';
import { isValidPointerOverEvent } from '../../../../utils/events';
import { IndexedGeometry } from '../../../../utils/geometry';
import { Point } from '../../../../utils/point';
import { getTooltipCompareFn } from '../../../../utils/series_sort';
import { isPointOnGeometry } from '../../rendering/utils';
import { formatTooltip } from '../../tooltip/tooltip';
import { defaultXYLegendSeriesSort } from '../../utils/default_series_sort_fn';
import { DataSeries } from '../../utils/series';
import { BasicSeriesSpec, AxisSpec } from '../../utils/specs';
import { getAxesSpecForSpecId, getSpecDomainGroupId, getSpecsById } from '../utils/spec';
import { ComputedScales } from '../utils/types';
import { getComputedScalesSelector } from './get_computed_scales';
import { getElementAtCursorPositionSelector } from './get_elements_at_cursor_pos';
import { getOrientedProjectedPointerPositionSelector } from './get_oriented_projected_pointer_position';
import { getProjectedPointerPositionSelector } from './get_projected_pointer_position';
import { getSiDataSeriesMapSelector } from './get_si_dataseries_map';
import { getSeriesSpecsSelector, getAxisSpecsSelector } from './get_specs';
import { hasSingleSeriesSelector } from './has_single_series';

const EMPTY_VALUES = Object.freeze({
  tooltip: {
    header: null,
    values: [],
  },
  highlightedGeometries: [],
});

/** @internal */
export interface TooltipAndHighlightedGeoms {
  tooltip: TooltipInfo;
  highlightedGeometries: IndexedGeometry[];
}

const getExternalPointerEventStateSelector = (state: GlobalChartState) => state.externalEvents.pointer;

/** @internal */
export const getTooltipInfoAndGeometriesSelector = createCachedSelector(
  [
    getSeriesSpecsSelector,
    getAxisSpecsSelector,
    getSettingsSpecSelector,
    getProjectedPointerPositionSelector,
    getOrientedProjectedPointerPositionSelector,
    getChartRotationSelector,
    hasSingleSeriesSelector,
    getComputedScalesSelector,
    getElementAtCursorPositionSelector,
    getSiDataSeriesMapSelector,
    getExternalPointerEventStateSelector,
    getTooltipHeaderFormatterSelector,
  ],
  getTooltipAndHighlightFromValue,
)(({ chartId }) => chartId);

function getTooltipAndHighlightFromValue(
  seriesSpecs: BasicSeriesSpec[],
  axesSpecs: AxisSpec[],
  settings: SettingsSpec,
  projectedPointerPosition: Point,
  orientedProjectedPointerPosition: Point,
  chartRotation: Rotation,
  hasSingleSeries: boolean,
  scales: ComputedScales,
  matchingGeoms: IndexedGeometry[],
  serialIdentifierDataSeriesMap: Record<string, DataSeries>,
  externalPointerEvent: PointerEvent | null,
  tooltipHeaderFormatter?: TooltipValueFormatter,
): TooltipAndHighlightedGeoms {
  if (!scales.xScale || !scales.yScales) {
    return EMPTY_VALUES;
  }

  let { x, y } = orientedProjectedPointerPosition;
  let tooltipType = getTooltipType(settings);
  if (isValidPointerOverEvent(scales.xScale, externalPointerEvent)) {
    tooltipType = getTooltipType(settings, true);
    const scaledX = scales.xScale.pureScale(externalPointerEvent.value);

    if (scaledX === null) {
      return EMPTY_VALUES;
    }

    x = scaledX;
    y = 0;
  } else if (projectedPointerPosition.x === -1 || projectedPointerPosition.y === -1) {
    return EMPTY_VALUES;
  }

  if (tooltipType === TooltipType.None && !externalPointerEvent) {
    return EMPTY_VALUES;
  }

  if (matchingGeoms.length === 0) {
    return EMPTY_VALUES;
  }

  // build the tooltip value list
  let header: TooltipValue | null = null;
  const highlightedGeometries: IndexedGeometry[] = [];
  const xValues = new Set<any>();

  const values = matchingGeoms
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
      const yScale = scales.yScales.get(getSpecDomainGroupId(spec));
      if (!yScale) {
        return acc;
      }

      // check if the pointer is on the geometry (avoid checking if using external pointer event)
      let isHighlighted = false;
      if (
        (!externalPointerEvent || isPointerOutEvent(externalPointerEvent)) &&
        isPointOnGeometry(x, y, indexedGeometry, settings.pointBuffer)
      ) {
        isHighlighted = true;
        highlightedGeometries.push(indexedGeometry);
      }

      // if it's a follow tooltip, and no element is highlighted
      // do _not_ add element into tooltip list
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

      xValues.add(indexedGeometry.value.x);

      return [...acc, formattedTooltip];
    }, []);

  if (values.length > 1 && xValues.size === values.length) {
    // TODO: remove after tooltip redesign
    header = null;
  }

  const tooltipSortFn = getTooltipCompareFn((settings as any).sortSeriesBy, (a, b) => {
    const aDs = serialIdentifierDataSeriesMap[a.key];
    const bDs = serialIdentifierDataSeriesMap[b.key];
    return defaultXYLegendSeriesSort(aDs, bDs);
  });

  const sortedTooltipValues = values.sort((a, b) => {
    return tooltipSortFn(a.seriesIdentifier, b.seriesIdentifier);
  });
  return {
    tooltip: {
      header,
      // to avoid creating a breaking change because of a different sorting order on tooltip
      values: sortedTooltipValues,
    },
    highlightedGeometries,
  };
}

/** @internal */
export const getTooltipInfoSelector = createCachedSelector(
  [getTooltipInfoAndGeometriesSelector],
  ({ tooltip }): TooltipInfo => tooltip,
)(getChartIdSelector);

/** @internal */
export const getHighlightedGeomsSelector = createCachedSelector(
  [getTooltipInfoAndGeometriesSelector],
  ({ highlightedGeometries }): IndexedGeometry[] => highlightedGeometries,
)(getChartIdSelector);
