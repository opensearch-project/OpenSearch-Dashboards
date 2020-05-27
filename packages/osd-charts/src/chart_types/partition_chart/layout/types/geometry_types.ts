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

// In preparation of nominal types in future TS versions
// https://github.com/microsoft/TypeScript/pull/33038
// eg. to avoid adding angles and coordinates and similar inconsistent number/number ops.
// could in theory be three-valued (in,on,out)
// It also serves as documentation.

export type Pixels = number;
export type Ratio = number;
export type SizeRatio = Ratio;
type Cartesian = number;
export type Coordinate = Cartesian;
export type Radius = Cartesian;
export type Radian = Cartesian; // we measure angle in radians, and there's unity between radians and cartesian distances which is the whole point of radians; this is also relevant as we use small-angle approximations
export type Distance = Cartesian;

/** @internal */
export interface PointObject {
  x: Coordinate;
  y: Coordinate;
}

/** @internal */
export type PointTuple = [Coordinate, Coordinate];

/** @internal */
export type PointTuples = [PointTuple, ...PointTuple[]]; // at least one point

/** @internal */
export class Circline {
  x: Coordinate = NaN;
  y: Coordinate = NaN;
  r: Radius = NaN;
}

/** @internal */
export interface CirclinePredicate extends Circline {
  inside: boolean;
}

/** @internal */
export interface CirclineArc extends Circline {
  from: Radian;
  to: Radian;
}

/** @internal */
type CirclinePredicateSet = CirclinePredicate[];

/** @internal */
export type RingSectorConstruction = CirclinePredicateSet;

export type TimeMs = number;
