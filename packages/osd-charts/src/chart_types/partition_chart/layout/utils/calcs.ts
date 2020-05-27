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

import { Ratio } from '../types/geometry_types';
import { RgbTuple, stringToRGB } from './d3_utils';
import { Color } from '../../../../utils/commons';

/** @internal */
export function hueInterpolator(colors: RgbTuple[]) {
  return (d: number) => {
    const index = Math.round(d * 255);
    const [r, g, b, a] = colors[index];
    return colors[index].length === 3 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
  };
}

/** @internal */
export function addOpacity(hexColorString: string, opacity: Ratio) {
  // this is a super imperfect multiplicative alpha blender that assumes a "#rrggbb" or "#rrggbbaa" hexColorString
  // todo roll some proper utility that can handle "rgb(...)", "rgba(...)", "red", {r, g, b} etc.
  return opacity === 1
    ? hexColorString
    : hexColorString.slice(0, 7) +
        (hexColorString.slice(7).length === 0 || parseInt(hexColorString.slice(7, 2), 16) === 255
          ? `00${Math.round(opacity * 255).toString(16)}`.substr(-2) // color was of full opacity
          : `00${Math.round((parseInt(hexColorString.slice(7, 2), 16) / 255) * opacity * 255).toString(16)}`.substr(
              -2,
            ));
}

/** @internal */
export function arrayToLookup(keyFun: Function, array: Array<any>) {
  return Object.assign({}, ...array.map((d) => ({ [keyFun(d)]: d })));
}

/** @internal */
export function colorIsDark(color: Color) {
  // fixme this assumes a white or very light background
  const rgba = stringToRGB(color);
  const { r, g, b, opacity } = rgba;
  const a = rgba.hasOwnProperty('opacity') ? opacity : 1;
  return r * 0.299 + g * 0.587 + b * 0.114 < a * 150;
}

/** @internal */
export function getTextColor(shapeFillColor: Color, textColor: Color, textInvertible: boolean) {
  const { r: tr, g: tg, b: tb, opacity: to } = stringToRGB(textColor);
  const backgroundIsDark = colorIsDark(shapeFillColor);
  const specifiedTextColorIsDark = colorIsDark(textColor);
  const inverseForContrast = textInvertible && specifiedTextColorIsDark === backgroundIsDark;
  return inverseForContrast
    ? to === undefined
      ? `rgb(${255 - tr}, ${255 - tg}, ${255 - tb})`
      : `rgba(${255 - tr}, ${255 - tg}, ${255 - tb}, ${to})`
    : textColor;
}

/** @internal */
export function integerSnap(n: number) {
  return Math.floor(n);
}

type NumberMap = (n: number) => number;

/**
 * `monotonicHillClimb` attempts to return a variable value that's associated with the highest valued response (as returned by invoking `getResponse`
 * with said variable) yet still within the bounds for that response value, ie. constrained to smaller than or equal `responseUpperConstraint`.
 * `minVar` and `maxVar` represent a closed interval constraint on the variable itself.
 * `domainSnap` is useful if all real values in the range can't be assumed by the variable; typically, if the variable is integer only,
 * such as the number of characters, or avoiding fractional font sizes.
 * It is required that `getResponse` is a monotonic function over [minVar, maxVar], ie. a larger `n` value in this domain can't lead to
 * a smaller return value. However, as it's an internal function with known use cases, there's no runtime check to assert this.
 * Which is why the name expresses it prominently.
 */
/** @internal */
export function monotonicHillClimb(
  getResponse: NumberMap,
  maxVar: number,
  responseUpperConstraint: number,
  domainSnap: NumberMap = (n: number) => n,
  minVar: number = 0,
) {
  let loVar = domainSnap(minVar);
  const loResponse = getResponse(loVar);
  let hiVar = domainSnap(maxVar);
  let hiResponse = getResponse(hiVar);

  if (loResponse > responseUpperConstraint || loVar > hiVar) {
    // bail if even the lowest value doesn't satisfy the constraint
    return NaN;
  }

  if (hiResponse <= responseUpperConstraint) {
    return hiVar; // early bail if maxVar is compliant
  }

  let pivotVar: number = NaN;
  let pivotResponse: number = NaN;
  let lastPivotResponse: number = NaN;
  while (loVar < hiVar) {
    const newPivotVar = (loVar + hiVar) / 2;
    const newPivotResponse = getResponse(domainSnap(newPivotVar));
    if (newPivotResponse === pivotResponse || newPivotResponse === lastPivotResponse) {
      return domainSnap(loVar); // bail if we're good and not making further progress
    }
    pivotVar = newPivotVar;
    lastPivotResponse = pivotResponse; // for prevention of bistable oscillation around discretization snap
    pivotResponse = newPivotResponse;
    const pivotIsCompliant = pivotResponse <= responseUpperConstraint;
    if (pivotIsCompliant) {
      loVar = pivotVar;
    } else {
      hiVar = pivotVar;
      hiResponse = pivotResponse;
    }
  }
  return domainSnap(pivotVar);
}
