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

import { PointShape } from '../../../utils/themes/theme';

/** @internal */
export type SVGPath = string;

/** @internal */
export type SVGPathFn = (radius: number) => SVGPath;

/** @internal */
export const cross: SVGPathFn = (r: number) => {
  return `M ${-r} 0 L ${r} 0 M 0 ${r} L 0 ${-r}`;
};

/** @internal */
export const triangle: SVGPathFn = (r: number) => {
  const h = (r * Math.sqrt(3)) / 2;
  const hr = r / 2;
  return `M ${-h} ${hr} L ${h} ${hr} L 0 ${-r} Z`;
};

/** @internal */
export const square: SVGPathFn = (r: number) => {
  return `M ${-r} ${-r} L ${-r} ${r} L ${r} ${r} L ${r} ${-r} Z`;
};

/** @internal */
export const circle: SVGPathFn = (r: number) => {
  return `M ${-r} ${0} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 ${-r * 2},0`;
};

/** @internal */
export const ShapeRendererFn: Record<PointShape, [SVGPathFn, number]> = {
  [PointShape.Circle]: [circle, 0],
  [PointShape.X]: [cross, 45],
  [PointShape.Plus]: [cross, 0],
  [PointShape.Diamond]: [square, 45],
  [PointShape.Square]: [square, 0],
  [PointShape.Triangle]: [triangle, 0],
};
