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
import { CurveType, getCurveFactory } from './curves';

describe('Curve utils', () => {
  test('factory', () => {
    expect(getCurveFactory(CurveType.CURVE_CARDINAL)).toBe(curveCardinal);
    expect(getCurveFactory(CurveType.CURVE_BASIS)).toBe(curveBasis);
    expect(getCurveFactory(CurveType.CURVE_CATMULL_ROM)).toBe(curveCatmullRom);
    expect(getCurveFactory(CurveType.CURVE_MONOTONE_X)).toBe(curveMonotoneX);
    expect(getCurveFactory(CurveType.CURVE_MONOTONE_Y)).toBe(curveMonotoneY);
    expect(getCurveFactory(CurveType.CURVE_NATURAL)).toBe(curveNatural);
    expect(getCurveFactory(CurveType.CURVE_STEP)).toBe(curveStep);
    expect(getCurveFactory(CurveType.CURVE_STEP_AFTER)).toBe(curveStepAfter);
    expect(getCurveFactory(CurveType.CURVE_STEP_BEFORE)).toBe(curveStepBefore);
    expect(getCurveFactory(CurveType.LINEAR)).toBe(curveLinear);
    expect(getCurveFactory()).toBe(curveLinear);
  });
});
