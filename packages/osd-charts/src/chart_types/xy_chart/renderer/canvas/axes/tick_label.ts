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

import { AxisProps } from '.';
import { Font, FontStyle } from '../../../../../common/text_utils';
import { withContext } from '../../../../../renderers/canvas';
import { AxisTick, getTickLabelProps } from '../../../utils/axis_utils';
import { renderText } from '../primitives/text';
import { renderDebugRectCenterRotated } from '../utils/debug';

/** @internal */
export function renderTickLabel(ctx: CanvasRenderingContext2D, tick: AxisTick, showTicks: boolean, props: AxisProps) {
  const {
    axisSpec: { position, labelFormat },
    dimension: axisTicksDimensions,
    size,
    debug,
    axisStyle,
  } = props;
  const labelStyle = axisStyle.tickLabel;
  const { rotation: tickLabelRotation, alignment, offset } = labelStyle;

  const { maxLabelBboxWidth, maxLabelBboxHeight, maxLabelTextWidth, maxLabelTextHeight } = axisTicksDimensions;
  const { x, y, offsetX, offsetY, textOffsetX, textOffsetY, horizontalAlign, verticalAlign } = getTickLabelProps(
    axisStyle,
    tick.position,
    position,
    tickLabelRotation,
    size,
    axisTicksDimensions,
    showTicks,
    offset,
    alignment,
  );

  if (debug) {
    // full text container
    renderDebugRectCenterRotated(
      ctx,
      {
        x: x + offsetX,
        y: y + offsetY,
      },
      {
        x: x + offsetX,
        y: y + offsetY,
        height: maxLabelTextHeight,
        width: maxLabelTextWidth,
      },
      undefined,
      undefined,
      tickLabelRotation,
    );
    // rotated text container
    if (![0, -90, 90, 180].includes(tickLabelRotation)) {
      renderDebugRectCenterRotated(
        ctx,
        {
          x: x + offsetX,
          y: y + offsetY,
        },
        {
          x: x + offsetX,
          y: y + offsetY,
          height: maxLabelBboxHeight,
          width: maxLabelBboxWidth,
        },
        undefined,
        undefined,
        0,
      );
    }
  }
  const font: Font = {
    fontFamily: labelStyle.fontFamily,
    fontStyle: labelStyle.fontStyle ? (labelStyle.fontStyle as FontStyle) : 'normal',
    fontVariant: 'normal',
    fontWeight: 'normal',
    textColor: labelStyle.fill,
    textOpacity: 1,
  };
  withContext(ctx, (ctx) => {
    renderText(
      ctx,
      {
        x: x + offsetX,
        y: y + offsetY,
      },
      labelFormat ? labelFormat(tick.value) : tick.label,
      {
        ...font,
        fontSize: labelStyle.fontSize,
        fill: labelStyle.fill,
        align: horizontalAlign as CanvasTextAlign,
        baseline: verticalAlign as CanvasTextBaseline,
      },
      tickLabelRotation,
      {
        x: textOffsetX,
        y: textOffsetY,
      },
    );
  });
}
