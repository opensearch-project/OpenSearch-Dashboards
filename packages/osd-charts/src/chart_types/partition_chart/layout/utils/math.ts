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

import { wrapToTau } from '../geometry';

export const TAU = 2 * Math.PI;
export const RIGHT_ANGLE = TAU / 4;
export const GOLDEN_RATIO = 1.618;

/** @internal */
export function trueBearingToStandardPositionAngle(alphaIn: number) {
  return wrapToTau(RIGHT_ANGLE - alphaIn);
}

/** @internal */
export function logarithm(base: number, y: number) {
  return Math.log(y) / Math.log(base);
}
