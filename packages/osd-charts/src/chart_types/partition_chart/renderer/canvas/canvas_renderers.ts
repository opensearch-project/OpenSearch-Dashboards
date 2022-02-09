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

import { addOpacity } from '../../../../common/color_calcs';
import { TAU } from '../../../../common/constants';
import { Pixels } from '../../../../common/geometry';
import { cssFontShorthand } from '../../../../common/text_utils';
import { renderLayers, withContext } from '../../../../renderers/canvas';
import { Color } from '../../../../utils/common';
import {
  LinkLabelVM,
  OutsideLinksViewModel,
  QuadViewModel,
  RowSet,
  ShapeViewModel,
  TextRow,
} from '../../layout/types/viewmodel_types';
import { LinkLabelsViewModelSpec } from '../../layout/viewmodel/link_text_layout';
import { isSunburst, panelTitleFontSize } from '../../layout/viewmodel/viewmodel';

// the burnout avoidance in the center of the pie
const LINE_WIDTH_MULT = 10; // border can be a maximum 1/LINE_WIDTH_MULT - th of the sector angle, otherwise the border would dominate
const TAPER_OFF_LIMIT = 50; // taper off within a radius of TAPER_OFF_LIMIT to avoid burnout in the middle of the pie when there are hundreds of pies

function renderTextRow(
  ctx: CanvasRenderingContext2D,
  { fontSize, fillTextColor, rotation, verticalAlignment, leftAlign, container, clipText }: RowSet,
  linkLabelTextColor: string,
) {
  return (currentRow: TextRow) => {
    const crx = leftAlign
      ? currentRow.rowAnchorX - currentRow.maximumLength / 2
      : currentRow.rowAnchorX - (Math.cos(rotation) * currentRow.length) / 2;
    const cry = -currentRow.rowAnchorY + (Math.sin(rotation) * currentRow.length) / 2;
    if (!Number.isFinite(crx) || !Number.isFinite(cry)) {
      return;
    }
    withContext(ctx, (ctx) => {
      ctx.scale(1, -1);
      if (clipText) {
        ctx.rect(container.x0 + 1, container.y0 + 1, container.x1 - container.x0 - 2, container.y1 - container.y0 - 2);
        ctx.clip();
      }
      ctx.beginPath();
      ctx.translate(crx, cry);
      ctx.rotate(-rotation);
      ctx.fillStyle = fillTextColor ?? linkLabelTextColor;
      ctx.textBaseline = verticalAlignment;
      currentRow.rowWords.forEach((box) => {
        ctx.font = cssFontShorthand(box, fontSize);
        ctx.fillText(box.text, box.width / 2 + box.wordBeginning, 0);
      });
      ctx.closePath();
    });
    // for debug use: this draws magenta boxes for where the text needs to fit
    // note: `container` is a property of the RowSet, needs to be added
    // withContext(ctx, (ctx) => {
    //   ctx.scale(1, -1);
    //   ctx.rotate(-rotation);
    //   ctx.beginPath();
    //   ctx.strokeStyle = 'magenta';
    //   ctx.fillStyle = 'magenta';
    //   ctx.lineWidth = 1;
    //   ctx.rect(container.x0 + 1, container.y0 + 1, container.x1 - container.x0 - 2, container.y1 - container.y0 - 2);
    //   ctx.stroke();
    // });
  };
}

function renderTextRows(ctx: CanvasRenderingContext2D, rowSet: RowSet, linkLabelTextColor: string) {
  rowSet.rows.forEach(renderTextRow(ctx, rowSet, linkLabelTextColor));
}

function renderRowSets(ctx: CanvasRenderingContext2D, rowSets: RowSet[], linkLabelTextColor: string) {
  rowSets.forEach((rowSet: RowSet) => renderTextRows(ctx, rowSet, linkLabelTextColor));
}

function renderTaperedBorder(
  ctx: CanvasRenderingContext2D,
  { strokeWidth, strokeStyle, fillColor, x0, x1, y0px, y1px }: QuadViewModel,
) {
  const X0 = x0 - TAU / 4;
  const X1 = x1 - TAU / 4;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  // only draw circular arcs if it would be distinguishable from a straight line ie. angle is not very small
  ctx.arc(0, 0, y0px, X0, X0);
  ctx.arc(0, 0, y1px, X0, X1, false);
  ctx.arc(0, 0, y0px, X1, X0, true);

  ctx.fill();
  if (strokeWidth > 0.001 && !(x0 === 0 && x1 === TAU)) {
    // canvas2d uses a default of 1 if the lineWidth is assigned 0, so we use a small value to test, to avoid it
    // ... and also don't draw a separator if we have a single sector that's the full ring (eg. single-fact-row pie)
    // outer arc
    ctx.lineWidth = strokeWidth;
    const tapered = x1 - x0 < (15 * TAU) / 360; // burnout seems visible, and tapering invisible, with less than 15deg
    if (tapered) {
      ctx.beginPath();
      ctx.arc(0, 0, y1px, X0, X1, false);
      ctx.stroke();

      // inner arc
      ctx.beginPath();
      ctx.arc(0, 0, y0px, X1, X0, true);
      ctx.stroke();

      ctx.fillStyle = strokeStyle;

      // each side (radial 'line') is modeled as a pentagon (some lines can be short arcs though)
      ctx.beginPath();
      const yThreshold = Math.max(TAPER_OFF_LIMIT, (LINE_WIDTH_MULT * strokeWidth) / (X1 - X0));
      const beta = strokeWidth / yThreshold; // angle where strokeWidth equals the lineWidthMult limit at a radius of yThreshold
      ctx.arc(0, 0, y0px, X0, X0 + beta * (yThreshold / y0px));
      ctx.arc(0, 0, Math.min(yThreshold, y1px), X0 + beta, X0 + beta);
      ctx.arc(0, 0, y1px, X0 + beta * (yThreshold / y1px), X0, true);
      ctx.arc(0, 0, y0px, X0, X0);
      ctx.fill();
    } else {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
  }
}

function renderSectors(ctx: CanvasRenderingContext2D, quadViewModel: QuadViewModel[]) {
  withContext(ctx, (ctx) => {
    ctx.scale(1, -1); // D3 and Canvas2d use a left-handed coordinate system (+y = down) but the ViewModel uses +y = up, so we must locally invert Y
    quadViewModel.forEach((quad: QuadViewModel) => {
      if (quad.x0 === quad.x1) return; // no slice will be drawn, and it avoids some division by zero as well
      renderTaperedBorder(ctx, quad);
    });
  });
}

function renderRectangles(ctx: CanvasRenderingContext2D, quadViewModel: QuadViewModel[]) {
  withContext(ctx, (ctx) => {
    ctx.scale(1, -1); // D3 and Canvas2d use a left-handed coordinate system (+y = down) but the ViewModel uses +y = up, so we must locally invert Y
    quadViewModel.forEach(({ strokeWidth, fillColor, x0, x1, y0px, y1px }) => {
      // only draw a shape if it would show up at all
      if (x1 - x0 >= 1 && y1px - y0px >= 1) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x0, y0px);
        ctx.lineTo(x0, y1px);
        ctx.lineTo(x1, y1px);
        ctx.lineTo(x1, y0px);
        ctx.lineTo(x0, y0px);
        ctx.fill();
        if (strokeWidth > 0.001) {
          // Canvas2d stroke ignores an exact zero line width
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      }
    });
  });
}

function renderFillOutsideLinks(
  ctx: CanvasRenderingContext2D,
  outsideLinksViewModel: OutsideLinksViewModel[],
  linkLabelTextColor: string,
  linkLabelLineWidth: Pixels,
) {
  withContext(ctx, (ctx) => {
    ctx.lineWidth = linkLabelLineWidth;
    ctx.strokeStyle = linkLabelTextColor;
    outsideLinksViewModel.forEach(({ points }) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    });
  });
}

function renderLinkLabels(
  ctx: CanvasRenderingContext2D,
  linkLabelFontSize: Pixels,
  linkLabelLineWidth: Pixels,
  { linkLabels, labelFontSpec, valueFontSpec, strokeColor }: LinkLabelsViewModelSpec,
  linkLineColor: Color,
) {
  const labelColor = addOpacity(labelFontSpec.textColor, labelFontSpec.textOpacity);
  const valueColor = addOpacity(valueFontSpec.textColor, valueFontSpec.textOpacity);
  const labelValueGap = linkLabelFontSize / 2; // one en space
  withContext(ctx, (ctx) => {
    ctx.lineWidth = linkLabelLineWidth;
    linkLabels.forEach(({ linkLabels, translate, textAlign, text, valueText, width, valueWidth }: LinkLabelVM) => {
      // label lines
      ctx.beginPath();
      ctx.moveTo(...linkLabels[0]);
      linkLabels.slice(1).forEach((point) => ctx.lineTo(...point));
      ctx.strokeStyle = strokeColor ?? linkLineColor;

      ctx.stroke();
      withContext(ctx, (ctx) => {
        ctx.translate(...translate);
        ctx.scale(1, -1); // flip for text rendering not to be upside down
        ctx.textAlign = textAlign;
        // label text
        ctx.strokeStyle = labelColor;
        ctx.fillStyle = labelColor;
        ctx.font = `${labelFontSpec.fontStyle} ${labelFontSpec.fontVariant} ${labelFontSpec.fontWeight} ${linkLabelFontSize}px ${labelFontSpec.fontFamily}`;
        ctx.fillText(text, textAlign === 'right' ? -valueWidth - labelValueGap : 0, 0);
        // value text
        ctx.strokeStyle = valueColor;
        ctx.fillStyle = valueColor;
        ctx.font = `${valueFontSpec.fontStyle} ${valueFontSpec.fontVariant} ${valueFontSpec.fontWeight} ${linkLabelFontSize}px ${valueFontSpec.fontFamily}`;
        ctx.fillText(valueText, textAlign === 'left' ? width + labelValueGap : 0, 0);
      });
    });
  });
}

const midlineOffset = 0.35; // 0.35 is a [common constant](http://tavmjong.free.fr/SVG/TEXT_IN_A_BOX/index.html) representing half height
const innerPad = midlineOffset * panelTitleFontSize; // todo replace it with theme.axisPanelTitle.padding.inner

/** @internal */
export function renderPartitionCanvas2d(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  {
    width,
    height,
    panelTitle,
    config,
    quadViewModel,
    rowSets,
    outsideLinksViewModel,
    linkLabelViewModels,
    diskCenter,
    outerRadius,
  }: ShapeViewModel,
) {
  const { sectorLineWidth, sectorLineStroke, linkLabel } = config;

  const linkLineColor = addOpacity(linkLabel.textColor, linkLabel.textOpacity);

  withContext(ctx, (ctx) => {
    // set some defaults for the overall rendering

    // let's set the devicePixelRatio once and for all; then we'll never worry about it again
    ctx.scale(dpr, dpr);

    // all texts are currently center-aligned because
    //     - the calculations manually compute and lay out text (word) boxes, so we can choose whatever
    //     - but center/middle has mathematical simplicity and the most unassuming thing
    //     - due to using the math x/y convention (+y is up) while Canvas uses screen convention (+y is down)
    //         text rendering must be y-flipped, which is a bit easier this way
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // panel titles
    ctx.fillText(
      panelTitle,
      isSunburst(config.partitionLayout) ? diskCenter.x : diskCenter.x + (config.width * width) / 2,
      isSunburst(config.partitionLayout)
        ? config.linkLabel.maxCount > 0
          ? diskCenter.y - (config.height * height) / 2 + panelTitleFontSize
          : diskCenter.y - outerRadius - innerPad
        : diskCenter.y + 12,
    );

    ctx.textBaseline = 'middle';

    ctx.translate(diskCenter.x, diskCenter.y);
    // this applies the mathematical x/y conversion (+y is North) which is easier when developing geometry
    // functions - also, all renderers have flexibility (eg. SVG scale) and WebGL NDC is also +y up
    // - in any case, it's possible to refactor for a -y = North convention if that's deemed preferable
    ctx.scale(1, -1);

    ctx.lineJoin = 'round';
    ctx.strokeStyle = sectorLineStroke;
    ctx.lineWidth = sectorLineWidth;

    // painter's algorithm, like that of SVG: the sequence determines what overdraws what; first element of the array is drawn first
    // (of course, with SVG, it's for ambiguous situations only, eg. when 3D transforms with different Z values aren't used, but
    // unlike SVG and esp. WebGL, Canvas2d doesn't support the 3rd dimension well, see ctx.transform / ctx.setTransform).
    // The layers are callbacks, because of the need to not bake in the `ctx`, it feels more composable and uncoupled this way.
    renderLayers(ctx, [
      // bottom layer: sectors (pie slices, ring sectors etc.)
      (ctx: CanvasRenderingContext2D) =>
        isSunburst(config.partitionLayout) ? renderSectors(ctx, quadViewModel) : renderRectangles(ctx, quadViewModel),

      // all the fill-based, potentially multirow text, whether inside or outside the sector
      (ctx: CanvasRenderingContext2D) => renderRowSets(ctx, rowSets, linkLineColor),

      // the link lines for the outside-fill text
      (ctx: CanvasRenderingContext2D) =>
        renderFillOutsideLinks(ctx, outsideLinksViewModel, linkLineColor, linkLabel.lineWidth),

      // all the text and link lines for single-row outside texts
      (ctx: CanvasRenderingContext2D) =>
        renderLinkLabels(ctx, linkLabel.fontSize, linkLabel.lineWidth, linkLabelViewModels, linkLineColor),
    ]);
  });
}
