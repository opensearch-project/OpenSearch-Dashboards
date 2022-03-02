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

import { stringToRGB } from '../../../../../common/color_library_wrappers';
import { withContext } from '../../../../../renderers/canvas';
import { Position } from '../../../../../utils/common';
import { AxisId } from '../../../../../utils/ids';
import { Point } from '../../../../../utils/point';
import { PanelGeoms } from '../../../state/selectors/compute_panels';
import { getSpecsById } from '../../../state/utils/spec';
import { AxisSpec } from '../../../utils/specs';
import { AxesProps, AxisProps, renderAxis } from '../axes';
import { renderRect } from '../primitives/rect';
import { renderDebugRect } from '../utils/debug';
import { renderTitle } from './global_title';
import { renderPanelTitle } from './panel_title';

/** @internal */
export function renderGridPanels(ctx: CanvasRenderingContext2D, { x: chartX, y: chartY }: Point, panels: PanelGeoms) {
  panels.forEach(({ width, height, panelAnchor: { x: panelX, y: panelY } }) =>
    withContext(ctx, (ctx) =>
      renderRect(
        ctx,
        { x: chartX + panelX, y: chartY + panelY, width, height },
        { color: stringToRGB('#00000000') },
        { color: stringToRGB('#000000'), width: 1 },
      ),
    ),
  );
}

function renderPanel(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const { size, anchorPoint, debug, axisStyle, axisSpec, panelAnchor, secondary } = props;
  const { position } = axisSpec;
  const x = anchorPoint.x + (position === Position.Right ? -1 : 1) * panelAnchor.x;
  const y = anchorPoint.y + (position === Position.Bottom ? -1 : 1) * panelAnchor.y;

  withContext(ctx, (ctx) => {
    ctx.translate(x, y);
    if (debug && !secondary) renderDebugRect(ctx, { x: 0, y: 0, ...size });
    renderAxis(ctx, props); // For now, just render the axis line TODO: compute axis dimensions per panels
    if (!secondary) {
      const { panelTitle, dimension } = props;
      renderPanelTitle(ctx, { panelTitle, axisSpec, axisStyle, size, dimension, debug }); // fixme axisSpec/Style?
    }
  });
}

/** @internal */
export function renderPanelSubstrates(ctx: CanvasRenderingContext2D, props: AxesProps) {
  const { axesSpecs, perPanelAxisGeoms, axesStyles, sharedAxesStyle, debug, renderingArea } = props;
  const seenAxesTitleIds = new Set<AxisId>();

  perPanelAxisGeoms.forEach(({ axesGeoms, panelAnchor }) => {
    axesGeoms.forEach((geometry) => {
      const {
        axis: { panelTitle, id, position, secondary },
        anchorPoint,
        size,
        dimension,
        visibleTicks: ticks,
        parentSize,
      } = geometry;
      const axisSpec = getSpecsById<AxisSpec>(axesSpecs, id);

      if (!axisSpec || !dimension || !position || axisSpec.hide) {
        return;
      }

      const axisStyle = axesStyles.get(axisSpec.id) ?? sharedAxesStyle;

      if (!seenAxesTitleIds.has(id)) {
        seenAxesTitleIds.add(id);
        renderTitle(ctx, { size: parentSize, debug, panelTitle, anchorPoint, dimension, axisStyle, axisSpec });
      }

      renderPanel(ctx, {
        panelTitle,
        secondary,
        panelAnchor,
        axisSpec,
        anchorPoint,
        size,
        dimension,
        ticks,
        axisStyle,
        debug,
        renderingArea,
      });
    });
  });
}
