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

import { rgb as d3Rgb, RGBColor as D3RGBColor } from 'd3-color';

type RGB = number;
type A = number;
export type RgbTuple = [RGB, RGB, RGB, RGB?];
export type RgbObject = { r: RGB; g: RGB; b: RGB; opacity: A };

const defaultColor: RgbObject = { r: 255, g: 0, b: 0, opacity: 1 };
const defaultD3Color: D3RGBColor = d3Rgb(defaultColor.r, defaultColor.g, defaultColor.b, defaultColor.opacity);

/** @internal */
export function stringToRGB(cssColorSpecifier: string): RgbObject {
  return d3Rgb(cssColorSpecifier) || defaultColor;
}

function argsToRGB(r: number, g: number, b: number, opacity: number): D3RGBColor {
  return d3Rgb(r, g, b, opacity) || defaultD3Color;
}

/** @internal */
export function argsToRGBString(r: number, g: number, b: number, opacity: number): string {
  // d3.rgb returns an Rgb instance, which has a specialized `toString` method
  return argsToRGB(r, g, b, opacity).toString();
}

/** @internal */
export function RGBtoString(rgb: RgbObject): string {
  const { r, g, b, opacity } = rgb;
  return argsToRGBString(r, g, b, opacity);
}
