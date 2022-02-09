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

/** @internal */
export interface Dimensions {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** @internal */
export interface Size {
  width: number;
  height: number;
}

/**
 * fixme consider switching from `number` to `Pixels` or similar, once nominal typing is added
 * @public
 */
export interface PerSideDistance {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * fixme consider deactivating @typescript-eslint/no-empty-interface
 * see https://github.com/elastic/elastic-charts/pull/660#discussion_r419474171
 * @public
 */
export type Margins = PerSideDistance;

/** @public */
export type Padding = PerSideDistance;

/**
 * Simple padding declaration
 * @public
 */
export interface SimplePadding {
  outer: number;
  inner: number;
}

/**
 * Computes padding from number or `SimplePadding` with optional `minPadding`
 *
 * @param padding
 * @param minPadding should be at least one to avoid browser measureText inconsistencies
 * @internal
 */
export function getSimplePadding(padding: number | Partial<SimplePadding>, minPadding = 0): SimplePadding {
  if (typeof padding === 'number') {
    const adjustedPadding = Math.max(minPadding, padding);

    return {
      inner: adjustedPadding,
      outer: adjustedPadding,
    };
  }

  return {
    inner: Math.max(minPadding, padding?.inner ?? 0),
    outer: Math.max(minPadding, padding?.outer ?? 0),
  };
}
