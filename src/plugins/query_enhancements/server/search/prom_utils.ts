/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Default resolution for step calculation
export const DEFAULT_RESOLUTION = 1440;
// Minimum step interval in seconds
export const MIN_STEP_INTERVAL = 15;

function roundInterval(intervalMs: number): number {
  if (intervalMs <= 1) return 1;

  const magnitude = Math.pow(10, Math.floor(Math.log10(intervalMs)));
  const normalized = intervalMs / magnitude;

  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;

  return Math.round(nice * magnitude);
}

export function calculateStep(
  durationMs: number,
  resolution: number = DEFAULT_RESOLUTION,
  minIntervalSec: number = MIN_STEP_INTERVAL
): number {
  const rawIntervalMs = durationMs / resolution;
  const roundedIntervalMs = roundInterval(rawIntervalMs);
  const stepSec = roundedIntervalMs / 1000;
  return Math.max(stepSec, minIntervalSec);
}
