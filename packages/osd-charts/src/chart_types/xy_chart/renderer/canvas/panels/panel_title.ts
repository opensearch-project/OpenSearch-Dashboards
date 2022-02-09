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

import { FontStyle } from '../../../../../common/text_utils';
import { Position } from '../../../../../utils/common';
import { getSimplePadding } from '../../../../../utils/dimensions';
import { AxisStyle } from '../../../../../utils/themes/theme'; // todo revise if it should rely on axis-anything
import { isHorizontalAxis } from '../../../utils/axis_type_utils';
import { getTitleDimension, shouldShowTicks } from '../../../utils/axis_utils';
import { AxisProps } from '../axes';
import { renderText, TextFont } from '../primitives/text';
import { renderDebugRect } from '../utils/debug';

type PanelTitleProps = Pick<AxisProps, 'panelTitle' | 'axisSpec' | 'axisStyle' | 'size' | 'dimension' | 'debug'>;

/** @internal */
export function renderPanelTitle(ctx: CanvasRenderingContext2D, props: PanelTitleProps) {
  const {
    axisSpec: { position },
    axisStyle: { axisPanelTitle },
    panelTitle,
  } = props;
  if (!panelTitle || !axisPanelTitle.visible) {
    return null;
  }
  return isHorizontalAxis(position) ? renderHorizontalTitle(ctx, props) : renderVerticalTitle(ctx, props);
}

function renderVerticalTitle(ctx: CanvasRenderingContext2D, props: PanelTitleProps) {
  const {
    size: { height },
    axisSpec: { position, hide: hideAxis, title },
    dimension: { maxLabelBboxWidth },
    axisStyle: { axisTitle, axisPanelTitle, tickLine, tickLabel },
    debug,
    panelTitle,
  } = props;
  if (!panelTitle) {
    return null;
  }
  const font = getFontStyle(axisPanelTitle);
  const tickDimension = shouldShowTicks(tickLine, hideAxis) ? tickLine.size + tickLine.padding : 0;
  const panelTitlePadding = getSimplePadding(axisPanelTitle.visible && panelTitle ? axisPanelTitle.padding : 0);
  const titleDimension = title ? getTitleDimension(axisTitle) : 0;
  const labelPadding = getSimplePadding(tickLabel.padding);
  const labelWidth = tickLabel.visible ? labelPadding.outer + maxLabelBboxWidth + labelPadding.inner : 0;
  const top = height;
  const left =
    position === Position.Left
      ? titleDimension + panelTitlePadding.outer
      : tickDimension + labelWidth + panelTitlePadding.inner;

  if (debug) {
    renderDebugRect(ctx, { x: left, y: top, width: height, height: font.fontSize }, undefined, undefined, -90);
  }

  renderText(
    ctx,
    {
      x: left + font.fontSize / 2,
      y: top - height / 2,
    },
    panelTitle,
    font,
    -90,
  );
}

function renderHorizontalTitle(ctx: CanvasRenderingContext2D, props: PanelTitleProps) {
  const {
    size: { width },
    axisSpec: { position, hide: hideAxis, title },
    dimension: { maxLabelBboxHeight },
    axisStyle: { axisTitle, axisPanelTitle, tickLine, tickLabel },
    debug,
    panelTitle,
  } = props;

  if (!panelTitle) {
    return;
  }

  const font = getFontStyle(axisPanelTitle);
  const tickDimension = shouldShowTicks(tickLine, hideAxis) ? tickLine.size + tickLine.padding : 0;
  const panelTitlePadding = getSimplePadding(axisPanelTitle.visible && panelTitle ? axisPanelTitle.padding : 0);
  const titleDimension = title ? getTitleDimension(axisTitle) : 0;
  const labelPadding = getSimplePadding(tickLabel.padding);
  const labelHeight = tickLabel.visible ? maxLabelBboxHeight + labelPadding.outer + labelPadding.inner : 0;

  const top =
    position === Position.Top
      ? titleDimension + panelTitlePadding.outer
      : labelHeight + tickDimension + panelTitlePadding.inner;
  const left = 0;

  if (debug) {
    renderDebugRect(ctx, { x: left, y: top, width, height: font.fontSize });
  }

  renderText(
    ctx,
    {
      x: left + width / 2,
      y: top + font.fontSize / 2,
    },
    panelTitle,
    font,
  );
}

/** @internal */
export function getFontStyle({
  fontFamily,
  fontStyle,
  fill,
  fontSize,
}: AxisStyle['axisTitle'] | AxisStyle['axisPanelTitle']): TextFont {
  return {
    fontFamily,
    fontVariant: 'normal',
    fontStyle: fontStyle ? (fontStyle as FontStyle) : 'normal',
    fontWeight: 'normal',
    textColor: fill,
    textOpacity: 1,
    fill,
    align: 'center',
    baseline: 'middle',
    fontSize,
  };
}
