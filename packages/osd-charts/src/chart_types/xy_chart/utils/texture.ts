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

import { OpacityFn } from '../../../common/color_library_wrappers';
import { Texture } from '../../../geoms/types';
import { Color, ColorVariant, getColorFromVariant, getRadians } from '../../../utils/common';
import { Point } from '../../../utils/point';
import { TexturedStyles, TextureShape } from '../../../utils/themes/theme';
import { TextureRendererFn } from '../renderer/shapes_paths';

const getSpacing = ({ spacing }: TexturedStyles): Point => ({
  x: typeof spacing === 'number' ? spacing : spacing?.x ?? 0,
  y: typeof spacing === 'number' ? spacing : spacing?.y ?? 0,
});

const getPath = (textureStyle: TexturedStyles, size: number, stokeWith: number): [path: Path2D, rotation: number] => {
  if ('path' in textureStyle) {
    const path = typeof textureStyle.path === 'string' ? new Path2D(textureStyle.path) : textureStyle.path;

    return [path, 0];
  }
  const [pathFn, rotation] = TextureRendererFn[textureStyle.shape];
  // Prevents clipping shapes near edge
  const stokeWidthPadding = [TextureShape.Circle, TextureShape.Square].includes(textureStyle.shape as any)
    ? stokeWith
    : 0;

  return [new Path2D(pathFn((size - stokeWidthPadding) / 2)), rotation];
};

/** @internal */
function createPattern(
  ctx: CanvasRenderingContext2D,
  dpi: number,
  patternCanvas: HTMLCanvasElement,
  baseColor: Color | ColorVariant,
  fillOpacity: OpacityFn,
  textureStyle?: TexturedStyles,
): CanvasPattern | undefined {
  const pCtx = patternCanvas.getContext('2d');
  if (!textureStyle || !pCtx) return;

  const { size = 10, stroke, strokeWidth = 1, opacity, shapeRotation, fill, dash } = textureStyle;

  const spacing = getSpacing(textureStyle);
  const cssWidth = size + spacing.x;
  const cssHeight = size + spacing.y;
  patternCanvas.width = dpi * cssWidth;
  patternCanvas.height = dpi * cssHeight;

  pCtx.globalAlpha = opacity ? fillOpacity(opacity, 1) : fillOpacity(1);
  pCtx.lineWidth = strokeWidth;

  pCtx.strokeStyle = getColorFromVariant(baseColor, stroke ?? ColorVariant.Series);
  if (dash) pCtx.setLineDash(dash);

  if (fill) pCtx.fillStyle = getColorFromVariant(baseColor, fill);

  const [path, pathRotation] = getPath(textureStyle, size, strokeWidth);
  const rotation = (shapeRotation ?? 0) + pathRotation;

  pCtx.scale(dpi, dpi);
  pCtx.translate(cssWidth / 2, cssHeight / 2);

  if (rotation) pCtx.rotate(getRadians(rotation));

  pCtx.beginPath();

  if (path) {
    pCtx.stroke(path);
    if (fill) pCtx.fill(path);
  }

  return ctx.createPattern(patternCanvas, 'repeat') ?? undefined;
}

/** @internal */
export const getTextureStyles = (
  ctx: CanvasRenderingContext2D,
  patternCanvas: HTMLCanvasElement,
  baseColor: Color | ColorVariant,
  fillOpacity: OpacityFn,
  texture?: TexturedStyles,
): Texture | undefined => {
  const dpi = window.devicePixelRatio;
  const pattern = createPattern(ctx, dpi, patternCanvas, baseColor, fillOpacity, texture);

  if (!pattern || !texture) return;

  const scale = 1 / dpi;
  pattern.setTransform(new DOMMatrix([scale, 0, 0, scale, 0, 0]));
  const { rotation, offset } = texture;

  return {
    pattern,
    rotation,
    offset,
  };
};
