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
import { Dimensions } from '../../../../utils/dimensions';
import { Point } from '../../../../utils/point';
import { computeChartDimensionsSelector } from './compute_chart_dimensions';
import { getAxisSpecsSelector, getAnnotationSpecsSelector } from './get_specs';
import { AxisSpec, AnnotationSpec, AnnotationTypes } from '../../utils/specs';
import { Rotation } from '../../../../utils/commons';
import { computeAnnotationTooltipState } from '../../annotations/tooltip';
import { AnnotationTooltipState, AnnotationDimensions } from '../../annotations/types';
import { computeAnnotationDimensionsSelector } from './compute_annotations';
import { getChartRotationSelector } from '../../../../state/selectors/get_chart_rotation';
import { AnnotationId } from '../../../../utils/ids';
import { computeSeriesGeometriesSelector } from './compute_series_geometries';
import { ComputedGeometries } from '../utils';
import { getTooltipInfoSelector } from './get_tooltip_values_highlighted_geoms';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { GlobalChartState } from '../../../../state/chart_state';
import { TooltipInfo } from '../../../../components/tooltip/types';

const getCurrentPointerPosition = (state: GlobalChartState) => state.interactions.pointer.current.position;

/** @internal */
export const getAnnotationTooltipStateSelector = createCachedSelector(
  [
    getCurrentPointerPosition,
    computeChartDimensionsSelector,
    computeSeriesGeometriesSelector,
    getChartRotationSelector,
    getAnnotationSpecsSelector,
    getAxisSpecsSelector,
    computeAnnotationDimensionsSelector,
    getTooltipInfoSelector,
  ],
  getAnnotationTooltipState,
)(getChartIdSelector);

function getAnnotationTooltipState(
  { x, y }: Point,
  {
    chartDimensions,
  }: {
    chartDimensions: Dimensions;
  },
  geometries: ComputedGeometries,
  chartRotation: Rotation,
  annotationSpecs: AnnotationSpec[],
  axesSpecs: AxisSpec[],
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>,
  tooltip: TooltipInfo,
): AnnotationTooltipState | null {
  // get positions relative to chart
  if (x < 0 || y < 0) {
    return null;
  }
  const { xScale, yScales } = geometries.scales;
  // only if we have a valid cursor position and the necessary scale
  if (!xScale || !yScales) {
    return null;
  }
  // use area chart projected coordinates of the pointer
  const chartAreaProjectedPointer = { x: x - chartDimensions.left, y: y - chartDimensions.top };
  const tooltipState = computeAnnotationTooltipState(
    chartAreaProjectedPointer,
    annotationDimensions,
    annotationSpecs,
    chartRotation,
    axesSpecs,
    chartDimensions,
  );

  // If there's a highlighted chart element tooltip value, don't show annotation tooltip
  const isChartTooltipDisplayed = tooltip.values.some(({ isHighlighted }) => isHighlighted);
  if (
    tooltipState &&
    tooltipState.isVisible &&
    tooltipState.annotationType === AnnotationTypes.Rectangle &&
    isChartTooltipDisplayed
  ) {
    return null;
  }

  return tooltipState;
}
