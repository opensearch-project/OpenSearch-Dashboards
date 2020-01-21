import { wrapToTau } from '../geometry';

export const TAU = 2 * Math.PI;
export const RIGHT_ANGLE = TAU / 4;
export const GOLDEN_RATIO = 1.618;

export function trueBearingToStandardPositionAngle(alphaIn: number) {
  return wrapToTau(RIGHT_ANGLE - alphaIn);
}

export function logarithm(base: number, y: number) {
  return Math.log(y) / Math.log(base);
}
