/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_RESOLUTION = 1440;
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

const UNIT_TO_SECONDS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31536000,
};

export function parseStepIntervalSeconds(value: string): number | undefined {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)\s*$/.exec(value);
  if (!match) return undefined;
  const amount = parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return amount * UNIT_TO_SECONDS[match[2]];
}

export const ASSUMED_SCRAPE_INTERVAL = 60;

// The 4x floor keeps a rate() window spanning several samples even at small steps.
export function rateIntervalSeconds(stepSec: number, scrapeSec: number): number {
  return Math.max(stepSec + scrapeSec, 4 * scrapeSec);
}

export interface StepResolutionInput {
  rangeMs: number;
  resolution?: number;
  minStep?: string;
  stepOverrideSec?: number;
}

export interface ResolvedStep {
  stepSec: number;
  scrapeSec: number;
  rateIntervalSec: number;
}

export function resolveStep({
  rangeMs,
  resolution,
  minStep,
  stepOverrideSec,
}: StepResolutionInput): ResolvedStep {
  const parsed = minStep ? parseStepIntervalSeconds(minStep) : undefined;
  const minStepSec = parsed && parsed > 0 ? parsed : undefined;
  const stepSec =
    stepOverrideSec ??
    calculateStep(
      rangeMs,
      resolution && resolution > 0 ? resolution : DEFAULT_RESOLUTION,
      minStepSec ?? MIN_STEP_INTERVAL
    );
  const scrapeSec = minStepSec ?? ASSUMED_SCRAPE_INTERVAL;
  return { stepSec, scrapeSec, rateIntervalSec: rateIntervalSeconds(stepSec, scrapeSec) };
}

export function formatPromDuration(seconds: number): string {
  const totalMs = Math.round(seconds * 1000);
  if (totalMs <= 0) return '0s';
  const units: Array<[number, string]> = [
    [86400000, 'd'],
    [3600000, 'h'],
    [60000, 'm'],
    [1000, 's'],
    [1, 'ms'],
  ];
  let remaining = totalMs;
  let out = '';
  for (const [size, suffix] of units) {
    const value = Math.floor(remaining / size);
    if (value > 0) {
      out += `${value}${suffix}`;
      remaining -= value * size;
    }
  }
  return out;
}

export interface PromQLMacroContext {
  stepSec: number;
  rangeMs: number;
  scrapeSec: number;
}

const MACRO_PATTERN =
  /\$(?:__|\{__)(rate_interval|interval_ms|interval|range_ms|range_s|range)\}?/g;

export function interpolatePromQLMacros(query: string, ctx: PromQLMacroContext): string {
  return query.replace(MACRO_PATTERN, (match, name: string) => {
    switch (name) {
      case 'rate_interval':
        return formatPromDuration(rateIntervalSeconds(ctx.stepSec, ctx.scrapeSec));
      case 'interval_ms':
        return String(Math.round(ctx.stepSec * 1000));
      case 'interval':
        return formatPromDuration(ctx.stepSec);
      case 'range_ms':
        return String(Math.round(ctx.rangeMs));
      case 'range_s':
        return String(Math.round(ctx.rangeMs / 1000));
      case 'range':
        return formatPromDuration(ctx.rangeMs / 1000);
      default:
        return match;
    }
  });
}
