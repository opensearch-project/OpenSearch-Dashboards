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

import { ShapeViewModel } from '../../layout/types/viewmodel_types';
import { cssFontShorthand } from '../../../partition_chart/layout/utils/measure';
import { clearCanvas, renderLayers, withContext } from '../../../../renderers/canvas';
import { GOLDEN_RATIO } from '../../../partition_chart/layout/utils/math';
import { GOAL_SUBTYPES } from '../../specs/index';

// fixme turn these into config, or capitalize as constants
const referenceCircularSizeCap = 360; // goal/gauge won't be bigger even if there's ample room: it'd be a waste of space
const referenceBulletSizeCap = 500; // goal/gauge won't be bigger even if there's ample room: it'd be a waste of space
const barThicknessMinSizeRatio = 1 / 10; // bar thickness is a maximum of this fraction of the smaller graph area size
const baselineArcThickness = 32; // bar is this thick if there's ample room; no need for greater thickness even if there's a large area
const baselineBarThickness = 32; // bar is this thick if there's ample room; no need for greater thickness even if there's a large area
const marginRatio = 0.05; // same ratio on each side
const maxTickFontSize = 24;
const maxLabelFontSize = 32;
const maxCentralFontSize = 38;

function get<T>(o: { [k: string]: any }, name: string, dflt: T) {
  return name in o ? o[name] || dflt : dflt;
}

/** @internal */
export function renderCanvas2d(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  { config, bulletViewModel, chartCenter }: ShapeViewModel,
) {
  const {} = config;

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
    ctx.textBaseline = 'middle';
    ctx.translate(chartCenter.x, chartCenter.y);
    // this applies the mathematical x/y conversion (+y is North) which is easier when developing geometry
    // functions - also, all renderers have flexibility (eg. SVG scale) and WebGL NDC is also +y up
    // - in any case, it's possible to refactor for a -y = North convention if that's deemed preferable
    ctx.scale(1, -1);

    const {
      subtype,
      lowestValue,
      highestValue,
      base,
      target,
      actual,
      bands,
      ticks,
      labelMajor,
      labelMinor,
      centralMajor,
      centralMinor,
    } = bulletViewModel;

    const circular = subtype === GOAL_SUBTYPES[0];
    const vertical = subtype === GOAL_SUBTYPES[2];

    const domain = [lowestValue, highestValue];

    const data = {
      base: { value: base },
      ...Object.fromEntries(bands.map(({ value }, index) => [`qualitative_${index}`, { value }])),
      target: { value: target },
      actual: { value: actual },
      labelMajor: { value: domain[circular || !vertical ? 0 : 1], text: labelMajor },
      labelMinor: { value: domain[circular || !vertical ? 0 : 1], text: labelMinor },
      ...Object.assign({}, ...ticks.map(({ value, text }, i) => ({ [`tick_${i}`]: { value, text } }))),
      ...(circular
        ? {
            centralMajor: { value: 0, text: centralMajor },
            centralMinor: { value: 0, text: centralMinor },
          }
        : {}),
    };

    const minSize = Math.min(config.width, config.height);

    const referenceSize =
      Math.min(
        circular ? referenceCircularSizeCap : referenceBulletSizeCap,
        circular ? minSize : vertical ? config.height : config.width,
      ) *
      (1 - 2 * marginRatio);

    const barThickness = Math.min(
      circular ? baselineArcThickness : baselineBarThickness,
      referenceSize * barThicknessMinSizeRatio,
    );

    const tickLength = barThickness * Math.pow(1 / GOLDEN_RATIO, 3);
    const tickOffset = -tickLength / 2 - barThickness / 2;
    const tickFontSize = Math.min(maxTickFontSize, referenceSize / 25);
    const labelFontSize = Math.min(maxLabelFontSize, referenceSize / 18);
    const centralFontSize = Math.min(maxCentralFontSize, referenceSize / 14);

    const geoms = [
      ...bulletViewModel.bands.map((b, i) => ({
        order: 0,
        landmarks: {
          from: i ? `qualitative_${i - 1}` : 'base',
          to: `qualitative_${i}`,
        },
        aes: {
          shape: 'line',
          fillColor: b.fillColor,
          lineWidth: barThickness,
        },
      })),
      {
        order: 1,
        landmarks: { from: 'base', to: 'actual' },
        aes: { shape: 'line', fillColor: 'black', lineWidth: tickLength },
      },
      {
        order: 2,
        landmarks: { at: 'target' },
        aes: { shape: 'line', fillColor: 'black', lineWidth: barThickness / GOLDEN_RATIO },
      },
      ...bulletViewModel.ticks.map((b, i) => ({
        order: 3,
        landmarks: { at: `tick_${i}` },
        aes: {
          shape: 'line',
          fillColor: 'darkgrey',
          lineWidth: tickLength,
          axisNormalOffset: tickOffset,
        },
      })),
      ...bulletViewModel.ticks.map((b, i) => ({
        order: 4,
        landmarks: { at: `tick_${i}` },
        aes: {
          shape: 'text',
          textAlign: vertical ? 'right' : 'center',
          textBaseline: vertical ? 'middle' : 'top',
          fillColor: 'black',
          fontShape: { fontStyle: 'normal', fontVariant: 'normal', fontWeight: '500', fontFamily: 'sans-serif' },
          axisNormalOffset: -barThickness,
        },
      })),
      {
        order: 5,
        landmarks: { at: 'labelMajor' },
        aes: {
          shape: 'text',
          axisNormalOffset: 0,
          axisTangentOffset: circular || !vertical ? 0 : 2 * labelFontSize,
          textAlign: vertical ? 'center' : 'right',
          textBaseline: 'bottom',
          fillColor: 'black',
          fontShape: { fontStyle: 'normal', fontVariant: 'normal', fontWeight: '900', fontFamily: 'sans-serif' },
        },
      },
      {
        order: 5,
        landmarks: { at: 'labelMinor' },
        aes: {
          shape: 'text',
          axisNormalOffset: 0,
          axisTangentOffset: circular || !vertical ? 0 : 2 * labelFontSize,
          textAlign: vertical ? 'center' : 'right',
          textBaseline: 'top',
          fillColor: 'black',
          fontShape: { fontStyle: 'normal', fontVariant: 'normal', fontWeight: '300', fontFamily: 'sans-serif' },
        },
      },
      ...(circular
        ? [
            {
              order: 6,
              landmarks: { at: 'centralMajor' },
              aes: {
                shape: 'text',
                textAlign: 'center',
                textBaseline: 'bottom',
                fillColor: 'black',
                fontShape: { fontStyle: 'normal', fontVariant: 'normal', fontWeight: '900', fontFamily: 'sans-serif' },
              },
            },
            {
              order: 6,
              landmarks: { at: 'centralMinor' },
              aes: {
                shape: 'text',
                textAlign: 'center',
                textBaseline: 'top',
                fillColor: 'black',
                fontShape: { fontStyle: 'normal', fontVariant: 'normal', fontWeight: '300', fontFamily: 'sans-serif' },
              },
            },
          ]
        : []),
    ];

    const maxWidth = geoms.reduce((p, g) => Math.max(p, get<number>(g.aes, 'lineWidth', 0)), 0);
    const r = 0.5 * referenceSize - maxWidth / 2;

    renderLayers(ctx, [
      // clear the canvas
      (ctx: CanvasRenderingContext2D) => clearCanvas(ctx, 200000, 200000),

      (ctx: CanvasRenderingContext2D) =>
        withContext(ctx, (ctx) => {
          const fullSize = referenceSize;
          const labelSize = fullSize / 2;
          const pxRangeFrom = -fullSize / 2 + (circular || vertical ? 0 : labelSize);
          const pxRangeTo = fullSize / 2 + (!circular && vertical ? -2 * labelFontSize : 0);
          const pxRangeMid = (pxRangeFrom + pxRangeTo) / 2;
          const pxRange = pxRangeTo - pxRangeFrom;

          const domainExtent = domain[1] - domain[0];

          const linearScale = (x: number) => pxRangeFrom + (pxRange * (x - domain[0])) / domainExtent;

          const angleStart = config.angleStart;
          const angleEnd = config.angleEnd;
          const angleRange = angleEnd - angleStart;
          const angleScale = (x: number) => angleStart + (angleRange * (x - domain[0])) / domainExtent;
          const clockwise = angleStart > angleEnd; // todo refine this crude approach

          geoms
            .slice()
            .sort((a, b) => a.order - b.order)
            .forEach((g) => {
              const landmarks = g.landmarks;
              const at = get(landmarks, 'at', '');
              const from = get(landmarks, 'from', '');
              const to = get(landmarks, 'to', '');
              const textAlign = get(g.aes, 'textAlign', '');
              const textBaseline = get(g.aes, 'textBaseline', '');
              const fontShape = get(g.aes, 'fontShape', '');
              const axisNormalOffset = get(g.aes, 'axisNormalOffset', 0);
              const axisTangentOffset = get(g.aes, 'axisTangentOffset', 0);
              const lineWidth = get(g.aes, 'lineWidth', 0);
              const strokeStyle = get(g.aes, 'fillColor', '');
              withContext(ctx, (ctx) => {
                ctx.beginPath();
                if (circular) {
                  if (g.aes.shape === 'line') {
                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = strokeStyle;
                    if (at) {
                      ctx.arc(
                        pxRangeMid,
                        0,
                        r + axisNormalOffset,
                        angleScale(data[at].value) + Math.PI / 360,
                        angleScale(data[at].value) - Math.PI / 360,
                        true,
                      );
                    } else {
                      const dataClockwise = data[from].value < data[to].value;
                      ctx.arc(
                        pxRangeMid,
                        0,
                        r,
                        angleScale(data[from].value),
                        angleScale(data[to].value),
                        clockwise === dataClockwise,
                      );
                    }
                  } else if (g.aes.shape === 'text') {
                    const label = at.slice(0, 5) === 'label';
                    const central = at.slice(0, 7) === 'central';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = label || central ? textBaseline : 'middle';
                    ctx.font = cssFontShorthand(
                      fontShape,
                      label ? labelFontSize : central ? centralFontSize : tickFontSize,
                    );
                    ctx.scale(1, -1);
                    const angle = angleScale(data[at].value);
                    if (label) {
                      ctx.translate(0, r);
                    } else if (!central) {
                      ctx.translate(
                        (r - GOLDEN_RATIO * barThickness) * Math.cos(angle),
                        -(r - GOLDEN_RATIO * barThickness) * Math.sin(angle),
                      );
                    }
                    ctx.fillText(data[at].text, 0, 0);
                  }
                } else {
                  ctx.translate(
                    vertical ? axisNormalOffset : axisTangentOffset,
                    vertical ? axisTangentOffset : axisNormalOffset,
                  );
                  const atPx = data[at] && linearScale(data[at].value);
                  if (g.aes.shape === 'line') {
                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = g.aes.fillColor;
                    if (at) {
                      const atFromPx = atPx - 1;
                      const atToPx = atPx + 1;
                      ctx.moveTo(vertical ? 0 : atFromPx, vertical ? atFromPx : 0);
                      ctx.lineTo(vertical ? 0 : atToPx, vertical ? atToPx : 0);
                    } else {
                      const fromPx = linearScale(data[from].value);
                      const toPx = linearScale(data[to].value);
                      ctx.moveTo(vertical ? 0 : fromPx, vertical ? fromPx : 0);
                      ctx.lineTo(vertical ? 0 : toPx, vertical ? toPx : 0);
                    }
                  } else if (g.aes.shape === 'text') {
                    ctx.textAlign = textAlign;
                    ctx.textBaseline = textBaseline;
                    ctx.font = cssFontShorthand(fontShape, tickFontSize);
                    ctx.scale(1, -1);
                    ctx.translate(vertical ? 0 : atPx, vertical ? -atPx : 0);
                    ctx.fillText(data[at].text, 0, 0);
                  }
                }
                ctx.stroke();
              });
            });
        }),
    ]);
  });
}
