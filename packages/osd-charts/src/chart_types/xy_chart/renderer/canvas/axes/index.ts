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

import { Dimensions, Size } from '../../../../../utils/dimensions';
import { Point } from '../../../../../utils/point';
import { AxisStyle } from '../../../../../utils/themes/theme';
import { PerPanelAxisGeoms } from '../../../state/selectors/compute_per_panel_axes_geoms';
import { AxisTick, AxisViewModel, shouldShowTicks } from '../../../utils/axis_utils';
import { AxisSpec } from '../../../utils/specs';
import { renderAxisLine } from './line';
import { renderTick } from './tick';
import { renderTickLabel } from './tick_label';

/** @internal */
export interface AxisProps {
  panelTitle?: string | undefined;
  secondary?: boolean;
  panelAnchor: Point;
  axisStyle: AxisStyle;
  axisSpec: AxisSpec;
  size: Size;
  anchorPoint: Point;
  dimension: AxisViewModel;
  ticks: AxisTick[];
  debug: boolean;
  renderingArea: Dimensions;
}

/** @internal */
export interface AxesProps {
  axesSpecs: AxisSpec[];
  perPanelAxisGeoms: PerPanelAxisGeoms[];
  axesStyles: Map<string, AxisStyle | null>;
  sharedAxesStyle: AxisStyle;
  debug: boolean;
  renderingArea: Dimensions;
}

/** @internal */
export function renderAxis(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const { ticks, axisStyle, axisSpec, secondary } = props;
  const showTicks = shouldShowTicks(axisStyle.tickLine, axisSpec.hide);

  renderAxisLine(ctx, props); // render the axis line
  if (!secondary && showTicks) ticks.forEach((tick) => renderTick(ctx, tick, props));
  if (!secondary && axisStyle.tickLabel.visible) ticks.forEach((tick) => renderTickLabel(ctx, tick, showTicks, props));
}
