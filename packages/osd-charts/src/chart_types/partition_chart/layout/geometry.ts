import { Radian } from './types/geometry_types';
import { TAU } from './utils/math';

export function wrapToTau(a: Radian) {
  if (0 <= a && a <= TAU) return a; // efficient shortcut
  if (a < 0) a -= TAU * Math.floor(a / TAU);
  return a > TAU ? a % TAU : a;
}

export function diffAngle(a: Radian, b: Radian) {
  return ((a - b + Math.PI + TAU) % TAU) - Math.PI;
}

export function meanAngle(a: Radian, b: Radian) {
  return (TAU + b + diffAngle(a, b) / 2) % TAU;
}
