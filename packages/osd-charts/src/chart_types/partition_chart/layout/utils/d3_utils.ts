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

/** @internal */
export const defaultColor: RgbObject = { r: 255, g: 0, b: 0, opacity: 1 };
/** @internal */
export const transparentColor: RgbObject = { r: 0, g: 0, b: 0, opacity: 0 };
/** @internal */
export const defaultD3Color: D3RGBColor = d3Rgb(defaultColor.r, defaultColor.g, defaultColor.b, defaultColor.opacity);

/** @internal */
export type OpacityFn = (colorOpacity: number) => number;

/** @internal */
export function stringToRGB(cssColorSpecifier?: string, opacity?: number | OpacityFn): RgbObject {
  if (cssColorSpecifier === 'transparent') {
    return transparentColor;
  }
  const color = getColor(cssColorSpecifier);

  if (opacity === undefined) {
    return color;
  }

  const opacityOverride = typeof opacity === 'number' ? opacity : opacity(color.opacity);

  if (isNaN(opacityOverride)) {
    return color;
  }

  return {
    ...color,
    opacity: opacityOverride,
  };
}

/**
 * Returns color as RgbObject or default fallback.
 *
 * Handles issue in d3-color for hsla and rgba colors with alpha value of `0`
 *
 * @param cssColorSpecifier
 */
function getColor(cssColorSpecifier: string = ''): RgbObject {
  let color: D3RGBColor;
  const endRegEx = /,\s*0+(\.0*)?\s*\)$/;
  // TODO: make this check more robust
  if (/^(rgba|hsla)\(/i.test(cssColorSpecifier) && endRegEx.test(cssColorSpecifier)) {
    color = {
      ...d3Rgb(cssColorSpecifier.replace(endRegEx, ',1)')),
      opacity: 0,
    };
  } else {
    color = d3Rgb(cssColorSpecifier);
  }

  return validateColor(color) ?? defaultColor;
}

/** @internal */
export function validateColor(color: D3RGBColor): D3RGBColor | null {
  const { r, g, b, opacity } = color;

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(opacity)) {
    return null;
  }

  return color;
}

/** @internal */
export function argsToRGB(r: number, g: number, b: number, opacity: number): D3RGBColor {
  return validateColor(d3Rgb(r, g, b, opacity)) ?? defaultD3Color;
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
