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

import { Cartesian, Pixels, Ratio } from '../common/geometry';

/** @internal */
export type ArrayIndex = number;

/** @internal */
export interface ScaleCompression {
  bounds: ArrayIndex[];
  scaleMultiplier: Ratio;
}

/**
 * A set of Cartesian positioned items with screenspace size (eg. axis tick labels, or scatterplot points) are represented as:
 *   - a column vector of Cartesian positions in the domain (can be any unit)
 *   - a column vector of screenspace size (eg. widths in pixels) which has the same number of elements
 * The available room in the same screenspace units (practically, pixels) is supplied.
 *
 * Returns the scale multiplier, as well as the index of the elements determining (compressing) the scale, if solvable.
 * If not solvable, it returns a non-finite number in `scaleMultiplier` and no indices in `bounds`.
 * @internal
 */
export const screenspaceMarkerScaleCompressor = (
  domainPositions: Cartesian[],
  itemWidths: Pixels[],
  outerWidth: Pixels,
): ScaleCompression => {
  const result: ScaleCompression = { bounds: [], scaleMultiplier: Infinity };
  const itemCount = Math.min(domainPositions.length, itemWidths.length);
  for (let left = 0; left < itemCount; left++) {
    for (let right = 0; right < itemCount; right++) {
      if (domainPositions[left] > domainPositions[right]) continue; // must adhere to left <= right

      const range = outerWidth - itemWidths[left] / 2 - itemWidths[right] / 2; // negative if not enough room
      const domain = domainPositions[right] - domainPositions[left]; // always non-negative and finite
      const scaleMultiplier = range / domain; // may not be finite, and that's OK

      if (scaleMultiplier < result.scaleMultiplier || Number.isNaN(scaleMultiplier)) {
        result.bounds[0] = left;
        result.bounds[1] = right;
        result.scaleMultiplier = scaleMultiplier; // will persist a Number.finite() value for solvable pairs
      }
    }
  }

  return result;
};
