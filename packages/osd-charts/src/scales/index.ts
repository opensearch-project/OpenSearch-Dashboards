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

import { $Values } from 'utility-types';

/**
 * A `Scale` interface. A scale can map an input value within a specified domain
 * to an output value from a specified range.
 * The the value is mapped depending on the `type` (linear, log, sqrt, time, ordinal)
 */
export interface Scale {
  domain: any[];
  range: number[];
  ticks: () => any[];
  scale: (value: string | number) => number;
  pureScale: (value: any) => number;
  invert: (value: number) => any;
  invertWithStep: (
    value: number,
    data: any[],
  ) => {
    value: any;
    withinBandwidth: boolean;
  } | null;
  isSingleValue: () => boolean;
  /** Check if the passed value is within the scale domain */
  isValueInDomain: (value: any) => boolean;
  bandwidth: number;
  bandwidthPadding: number;
  minInterval: number;
  type: ScaleType;
  /**
   * @todo
   * designates unit of scale to compare to other Chart axis
   */
  unit?: string;
  isInverted: boolean;
  barsPadding: number;
}

/**
 * The scale type
 */
export const ScaleType = Object.freeze({
  Linear: 'linear' as 'linear',
  Ordinal: 'ordinal' as 'ordinal',
  Log: 'log' as 'log',
  Sqrt: 'sqrt' as 'sqrt',
  Time: 'time' as 'time',
});

export type ScaleType = $Values<typeof ScaleType>;

export type ScaleContinuousType = Exclude<ScaleType, typeof ScaleType.Ordinal>;

export type ScaleOrdinalType = typeof ScaleType.Ordinal;

export { ScaleBand } from './scale_band';

export { ScaleContinuous } from './scale_continuous';

export function isLogarithmicScale(scale: Scale) {
  return scale.type === ScaleType.Log;
}
