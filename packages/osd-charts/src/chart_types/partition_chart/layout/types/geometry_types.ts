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

export interface PointObject {
  x: Coordinate;
  y: Coordinate;
}

export type PointTuple = [Coordinate, Coordinate];

export class Circline {
  x: Coordinate = NaN;
  y: Coordinate = NaN;
  r: Radius = NaN;
}

export interface CirclinePredicate extends Circline {
  inside: boolean;
}

export interface CirclineArc extends Circline {
  from: Radian;
  to: Radian;
}

type CirclinePredicateSet = CirclinePredicate[];

export type RingSector = CirclinePredicateSet;

export type TimeMs = number;
