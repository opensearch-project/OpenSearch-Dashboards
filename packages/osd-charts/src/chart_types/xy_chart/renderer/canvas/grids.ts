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

import { withContext } from '../../../../renderers/canvas';
import { Dimensions } from '../../../../utils/dimensions';
import { AxisStyle } from '../../../../utils/themes/theme';
import { LinesGrid } from '../../utils/grid_lines';
import { AxisSpec } from '../../utils/specs';
import { renderMultiLine } from './primitives/line';

interface GridProps {
  sharedAxesStyle: AxisStyle;
  perPanelGridLines: Array<LinesGrid>;
  axesSpecs: AxisSpec[];
  renderingArea: Dimensions;
  axesStyles: Map<string, AxisStyle | null>;
}

/** @internal */
export function renderGrids(ctx: CanvasRenderingContext2D, props: GridProps) {
  const {
    perPanelGridLines,
    renderingArea: { left, top },
  } = props;
  withContext(ctx, (ctx) => {
    ctx.translate(left, top);

    perPanelGridLines.forEach(({ lineGroups, panelAnchor: { x, y } }) => {
      withContext(ctx, (ctx) => {
        ctx.translate(x, y);
        lineGroups.forEach(({ lines, stroke }) => {
          renderMultiLine(ctx, lines, stroke);
        });
      });
    });
  });
}
