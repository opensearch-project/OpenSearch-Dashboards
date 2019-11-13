import {
  curveBasis,
  curveCardinal,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
} from 'd3-shape';
import { $Values } from 'utility-types';

export const CurveType = Object.freeze({
  CURVE_CARDINAL: 0 as 0,
  CURVE_NATURAL: 1 as 1,
  CURVE_MONOTONE_X: 2 as 2,
  CURVE_MONOTONE_Y: 3 as 3,
  CURVE_BASIS: 4 as 4,
  CURVE_CATMULL_ROM: 5 as 5,
  CURVE_STEP: 6 as 6,
  CURVE_STEP_AFTER: 7 as 7,
  CURVE_STEP_BEFORE: 8 as 8,
  LINEAR: 9 as 9,
});

export type CurveType = $Values<typeof CurveType>;

export function getCurveFactory(curveType: CurveType = CurveType.LINEAR) {
  switch (curveType) {
    case CurveType.CURVE_CARDINAL:
      return curveCardinal;
    case CurveType.CURVE_NATURAL:
      return curveNatural;
    case CurveType.CURVE_MONOTONE_X:
      return curveMonotoneX;
    case CurveType.CURVE_MONOTONE_Y:
      return curveMonotoneY;
    case CurveType.CURVE_BASIS:
      return curveBasis;
    case CurveType.CURVE_CATMULL_ROM:
      return curveCatmullRom;
    case CurveType.CURVE_STEP:
      return curveStep;
    case CurveType.CURVE_STEP_AFTER:
      return curveStepAfter;
    case CurveType.CURVE_STEP_BEFORE:
      return curveStepBefore;
    case CurveType.LINEAR:
    default:
      return curveLinear;
  }
}
