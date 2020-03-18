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

import { Radian } from './types/geometry_types';
import { TAU } from './utils/math';

/** @internal */
export function wrapToTau(a: Radian) {
  if (0 <= a && a <= TAU) return a; // efficient shortcut
  if (a < 0) a -= TAU * Math.floor(a / TAU);
  return a > TAU ? a % TAU : a;
}

/** @internal */
export function diffAngle(a: Radian, b: Radian) {
  return ((a - b + Math.PI + TAU) % TAU) - Math.PI;
}

/** @internal */
export function meanAngle(a: Radian, b: Radian) {
  return (TAU + b + diffAngle(a, b) / 2) % TAU;
}
