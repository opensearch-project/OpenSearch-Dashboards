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

import { Font } from '../../../../common/text_utils';
import { clearCanvas, renderLayers, withContext } from '../../../../renderers/canvas';
import { renderMultiLine } from '../../../xy_chart/renderer/canvas/primitives/line';
import { renderRect } from '../../../xy_chart/renderer/canvas/primitives/rect';
import { renderText, wrapLines } from '../../../xy_chart/renderer/canvas/primitives/text';
import { ShapeViewModel } from '../../layout/types/viewmodel_types';

/** @internal */
export function renderCanvas2d(
  globalCtx: CanvasRenderingContext2D,
  dpr: number,
  { config, heatmapViewModel }: ShapeViewModel,
) {
  // eslint-disable-next-line no-empty-pattern
  const {} = config;
  withContext(globalCtx, (context) => {
    // set some defaults for the overall rendering

    // let's set the devicePixelRatio once and for all; then we'll never worry about it again
    context.scale(dpr, dpr);

    // all texts are currently center-aligned because
    //     - the calculations manually compute and lay out text (word) boxes, so we can choose whatever
    //     - but center/middle has mathematical simplicity and the most unassuming thing
    //     - due to using the math x/y convention (+y is up) while Canvas uses screen convention (+y is down)
    //         text rendering must be y-flipped, which is a bit easier this way
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    // ctx.translate(chartCenter.x, chartCenter.y);
    // this applies the mathematical x/y conversion (+y is North) which is easier when developing geometry
    // functions - also, all renderers have flexibility (eg. SVG scale) and WebGL NDC is also +y up
    // - in any case, it's possible to refactor for a -y = North convention if that's deemed preferable
    // ctx.scale(1, -1);

    // TODO this should be filtered by the pageSize AND the pageNumber
    const filteredCells = heatmapViewModel.cells.filter((cell) => {
      return cell.yIndex < heatmapViewModel.pageSize;
    });
    const filteredYValues = heatmapViewModel.yValues.filter((value, yIndex) => {
      return yIndex < heatmapViewModel.pageSize;
    });

    renderLayers(context, [
      // clear the canvas
      (ctx: CanvasRenderingContext2D) => clearCanvas(ctx, config.width, config.height),

      (ctx: CanvasRenderingContext2D) => {
        withContext(ctx, (ctx) => {
          // render grid
          renderMultiLine(ctx, heatmapViewModel.gridLines.x, heatmapViewModel.gridLines.stroke);
          renderMultiLine(ctx, heatmapViewModel.gridLines.y, heatmapViewModel.gridLines.stroke);
        });
      },
      (ctx: CanvasRenderingContext2D) =>
        withContext(ctx, (ctx) => {
          // render cells
          const { x, y } = heatmapViewModel.gridOrigin;
          ctx.translate(x, y);
          filteredCells.forEach((cell) => {
            if (!cell.visible) {
              return;
            }
            renderRect(ctx, cell, cell.fill, cell.stroke);
          });
        }),
      (ctx: CanvasRenderingContext2D) =>
        withContext(ctx, (ctx) => {
          // render text on cells
          const { x, y } = heatmapViewModel.gridOrigin;
          ctx.translate(x, y);
          if (!config.cell.label.visible) {
            return;
          }
          filteredCells.forEach((cell) => {
            if (!cell.visible) {
              return;
            }
            renderText(
              ctx,
              {
                x: cell.x + cell.width / 2,
                y: cell.y + cell.height / 2,
              },
              cell.formatted,
              config.cell.label,
            );
          });
        }),
      (ctx: CanvasRenderingContext2D) =>
        withContext(ctx, (ctx) => {
          // render text on Y axis
          if (!config.yAxisLabel.visible) {
            return;
          }
          filteredYValues.forEach((yValue) => {
            const font: Font = {
              fontFamily: config.yAxisLabel.fontFamily,
              fontStyle: config.yAxisLabel.fontStyle ? config.yAxisLabel.fontStyle : 'normal',
              fontVariant: 'normal',
              fontWeight: 'normal',
              textColor: 'black',
              textOpacity: 1,
            };
            const { padding } = config.yAxisLabel;
            const horizontalPadding =
              typeof padding === 'number' ? padding * 2 : (padding.left ?? 0) + (padding.right ?? 0);
            const [resultText] = wrapLines(
              ctx,
              yValue.text,
              font,
              config.yAxisLabel.fontSize,
              heatmapViewModel.gridOrigin.x - horizontalPadding,
              16,
              {
                shouldAddEllipsis: true,
                wrapAtWord: false,
              },
            ).lines;
            renderText(
              ctx,
              {
                x: yValue.x,
                y: yValue.y,
              },
              resultText,
              // the alignment for y axis labels is fixed to the right
              { ...config.yAxisLabel, align: 'right' },
            );
          });
        }),
      (ctx: CanvasRenderingContext2D) =>
        withContext(ctx, (ctx) => {
          // render text on X axis
          if (!config.xAxisLabel.visible) {
            return;
          }
          heatmapViewModel.xValues.forEach((xValue) => {
            renderText(
              ctx,
              {
                x: xValue.x,
                y: xValue.y,
              },
              xValue.text,
              config.xAxisLabel,
            );
          });
        }),
    ]);
  });
}
