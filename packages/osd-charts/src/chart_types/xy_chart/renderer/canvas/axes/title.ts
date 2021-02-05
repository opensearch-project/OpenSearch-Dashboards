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
import { Position } from '../../../../../utils/common';
import { getSimplePadding } from '../../../../../utils/dimensions';
import { isHorizontalAxis } from '../../../utils/axis_type_utils';
import { shouldShowTicks } from '../../../utils/axis_utils';
import { renderText } from '../primitives/text';
import { renderDebugRect } from '../utils/debug';

/** @internal */
export function renderTitle(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    axisSpec: { title, position },
    axisStyle: { axisTitle },
  } = props;
  if (!title || !axisTitle.visible) {
    return null;
  }
  if (isHorizontalAxis(position)) {
    return renderHorizontalTitle(ctx, props);
  }
  return renderVerticalTitle(ctx, props);
}

function renderVerticalTitle(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    size: { height },
    axisSpec: { position, hide: hideAxis },
    dimension: { maxLabelBboxWidth },
    axisStyle: { axisTitle, tickLine, tickLabel },
    debug,
    title,
  } = props;
  if (!title) {
    return null;
  }
  const tickDimension = shouldShowTicks(tickLine, hideAxis) ? tickLine.size + tickLine.padding : 0;
  const titlePadding = getSimplePadding(axisTitle.visible ? axisTitle.padding : 0);
  const labelPadding = getSimplePadding(tickLabel.padding);
  const labelWidth = tickLabel.visible ? labelPadding.outer + maxLabelBboxWidth + labelPadding.inner : 0;
  const top = height;
  const left = position === Position.Left ? titlePadding.outer : tickDimension + labelWidth + titlePadding.inner;

  if (debug) {
    renderDebugRect(ctx, { x: left, y: top, width: height, height: axisTitle.fontSize }, undefined, undefined, -90);
  }

  const font: Font = {
    fontFamily: axisTitle.fontFamily,
    fontVariant: 'normal',
    fontStyle: axisTitle.fontStyle ? (axisTitle.fontStyle as FontStyle) : 'normal',
    fontWeight: 'normal',
    textColor: axisTitle.fill,
    textOpacity: 1,
  };
  renderText(
    ctx,
    {
      x: left + axisTitle.fontSize / 2,
      y: top - height / 2,
    },
    title,
    { ...font, fill: axisTitle.fill, align: 'center', baseline: 'middle', fontSize: axisTitle.fontSize },
    -90,
  );
}
function renderHorizontalTitle(ctx: CanvasRenderingContext2D, props: AxisProps) {
  const {
    size: { width },
    axisSpec: { position, hide: hideAxis },
    dimension: { maxLabelBboxHeight },
    axisStyle: { axisTitle, tickLine, tickLabel },
    debug,
    title,
  } = props;

  if (!title) {
    return;
  }

  const tickDimension = shouldShowTicks(tickLine, hideAxis) ? tickLine.size + tickLine.padding : 0;
  const titlePadding = getSimplePadding(axisTitle.visible ? axisTitle.padding : 0);
  const labelPadding = getSimplePadding(tickLabel.padding);
  const labelHeight = tickLabel.visible ? maxLabelBboxHeight + labelPadding.outer + labelPadding.inner : 0;
  const top = position === Position.Top ? titlePadding.outer : labelHeight + tickDimension + titlePadding.inner;

  const left = 0;
  if (debug) {
    renderDebugRect(ctx, { x: left, y: top, width, height: axisTitle.fontSize });
  }
  const font: Font = {
    fontFamily: axisTitle.fontFamily,
    fontVariant: 'normal',
    fontStyle: axisTitle.fontStyle ? (axisTitle.fontStyle as FontStyle) : 'normal',
    fontWeight: 'normal',
    textColor: axisTitle.fill,
    textOpacity: 1,
  };
  renderText(
    ctx,
    {
      x: left + width / 2,
      y: top + axisTitle.fontSize / 2,
    },
    title,
    {
      ...font,
      fill: axisTitle.fill,
      align: 'center',
      baseline: 'middle',
      fontSize: axisTitle.fontSize,
    },
  );
}
