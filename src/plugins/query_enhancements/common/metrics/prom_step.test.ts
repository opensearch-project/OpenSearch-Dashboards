/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculateStep,
  DEFAULT_RESOLUTION,
  formatPromDuration,
  interpolatePromQLMacros,
  MAX_RESOLUTION,
  MIN_STEP_INTERVAL,
  parseStepIntervalSeconds,
  rateIntervalSeconds,
  resolveStep,
} from './prom_step';

describe('calculateStep', () => {
  it('returns the minimum step interval when the calculated step is smaller', () => {
    expect(calculateStep(60000)).toBe(MIN_STEP_INTERVAL);
  });

  it('calculates the step for common durations', () => {
    expect(calculateStep(3600000)).toBe(15);
    expect(calculateStep(86400000)).toBe(100);
    expect(calculateStep(604800000)).toBe(500);
    expect(calculateStep(2592000000)).toBe(2000);
  });

  it('respects a custom resolution', () => {
    expect(calculateStep(3600000, 100)).toBe(50);
  });

  it('respects a custom minimum interval', () => {
    expect(calculateStep(3600000, DEFAULT_RESOLUTION, 1)).toBe(5);
  });

  it('handles very large and very small durations', () => {
    expect(calculateStep(400 * 24 * 60 * 60 * 1000)).toBe(50000);
    expect(calculateStep(1000)).toBe(MIN_STEP_INTERVAL);
  });

  it('rounds raw intervals to a 1-2-5-10 sequence', () => {
    expect(calculateStep(1000 * DEFAULT_RESOLUTION, DEFAULT_RESOLUTION, 0)).toBe(1);
    expect(calculateStep(2000 * DEFAULT_RESOLUTION, DEFAULT_RESOLUTION, 0)).toBe(2);
    expect(calculateStep(5000 * DEFAULT_RESOLUTION, DEFAULT_RESOLUTION, 0)).toBe(5);
    expect(calculateStep(10000 * DEFAULT_RESOLUTION, DEFAULT_RESOLUTION, 0)).toBe(10);
    expect(calculateStep(60000 * DEFAULT_RESOLUTION, DEFAULT_RESOLUTION, 0)).toBe(100);
  });
});

describe('parseStepIntervalSeconds', () => {
  it('parses supported units into seconds', () => {
    expect(parseStepIntervalSeconds('500ms')).toBe(0.5);
    expect(parseStepIntervalSeconds('15s')).toBe(15);
    expect(parseStepIntervalSeconds('1m')).toBe(60);
    expect(parseStepIntervalSeconds('2h')).toBe(7200);
    expect(parseStepIntervalSeconds('1d')).toBe(86400);
    expect(parseStepIntervalSeconds('1w')).toBe(604800);
    expect(parseStepIntervalSeconds('1y')).toBe(31536000);
  });

  it('tolerates surrounding whitespace and decimals', () => {
    expect(parseStepIntervalSeconds('  30s ')).toBe(30);
    expect(parseStepIntervalSeconds('1.5m')).toBe(90);
  });

  it('returns undefined for unitless, empty, zero, or unparseable input', () => {
    expect(parseStepIntervalSeconds('')).toBeUndefined();
    expect(parseStepIntervalSeconds('60')).toBeUndefined();
    expect(parseStepIntervalSeconds('0s')).toBeUndefined();
    expect(parseStepIntervalSeconds('abc')).toBeUndefined();
    expect(parseStepIntervalSeconds('5mo')).toBeUndefined();
  });
});

describe('formatPromDuration', () => {
  it('formats single and multi-unit durations', () => {
    expect(formatPromDuration(15)).toBe('15s');
    expect(formatPromDuration(60)).toBe('1m');
    expect(formatPromDuration(90)).toBe('1m30s');
    expect(formatPromDuration(3661)).toBe('1h1m1s');
    expect(formatPromDuration(86400)).toBe('1d');
    expect(formatPromDuration(0.5)).toBe('500ms');
  });

  it('returns 0s for non-positive durations', () => {
    expect(formatPromDuration(0)).toBe('0s');
    expect(formatPromDuration(-5)).toBe('0s');
  });
});

describe('rateIntervalSeconds', () => {
  it('is at least four scrape intervals wide', () => {
    expect(rateIntervalSeconds(15, 60)).toBe(240);
  });

  it('grows with the step once it exceeds three scrape intervals', () => {
    expect(rateIntervalSeconds(300, 60)).toBe(360);
  });
});

describe('resolveStep', () => {
  const ONE_HOUR = 3600000;

  it('assumes a 60s scrape interval when no min step is configured', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR })).toEqual({
      stepSec: 15,
      scrapeSec: 60,
      rateIntervalSec: 240,
    });
  });

  it('treats the min step as the scrape interval and as the step floor', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, minStep: '5m' })).toEqual({
      stepSec: 300,
      scrapeSec: 300,
      rateIntervalSec: 1200,
    });
  });

  it('scales the step down to the requested resolution', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, resolution: 20 }).stepSec).toBe(200);
  });

  it('ignores a resolution finer than the step floor', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, resolution: 5000 }).stepSec).toBe(MIN_STEP_INTERVAL);
  });

  it('ignores unparseable and non-positive min steps', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, minStep: 'banana' }).stepSec).toBe(15);
    expect(resolveStep({ rangeMs: ONE_HOUR, minStep: '0s' }).scrapeSec).toBe(60);
  });

  it('honors an explicit step override, still sizing the rate window from it', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, minStep: '15s', stepOverrideSec: 60 })).toEqual({
      stepSec: 60,
      scrapeSec: 15,
      rateIntervalSec: 75,
    });
  });

  it('falls back to the default resolution for a non-positive resolution', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, resolution: 0 }).stepSec).toBe(
      calculateStep(ONE_HOUR, DEFAULT_RESOLUTION)
    );
  });

  it('floors the resolved step at one second when a fine min step drives it sub-second', () => {
    expect(
      resolveStep({ rangeMs: ONE_HOUR, resolution: MAX_RESOLUTION, minStep: '1ms' }).stepSec
    ).toBe(1);
  });

  it('floors an explicit sub-second step override', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, stepOverrideSec: 0.001 }).stepSec).toBe(1);
  });

  it('ignores a non-positive step override', () => {
    expect(resolveStep({ rangeMs: ONE_HOUR, stepOverrideSec: -5 }).stepSec).toBe(15);
  });

  it('clamps a resolution above the Prometheus point cap', () => {
    const clamped = resolveStep({ rangeMs: ONE_HOUR, resolution: 1_000_000 }).stepSec;
    expect(clamped).toBe(resolveStep({ rangeMs: ONE_HOUR, resolution: MAX_RESOLUTION }).stepSec);
  });
});

describe('interpolatePromQLMacros', () => {
  const ctx = { stepSec: 30, rangeMs: 24 * 60 * 60 * 1000, scrapeSec: 60 };

  it('substitutes rate_interval sized off the step and scrape interval', () => {
    expect(interpolatePromQLMacros('rate(up[$__rate_interval])', ctx)).toBe('rate(up[4m])');
  });

  it('substitutes interval and interval_ms', () => {
    expect(interpolatePromQLMacros('up[$__interval]', ctx)).toBe('up[30s]');
    expect(interpolatePromQLMacros('up offset $__interval_ms', ctx)).toBe('up offset 30000');
  });

  it('substitutes range macros', () => {
    expect(interpolatePromQLMacros('$__range', ctx)).toBe('1d');
    expect(interpolatePromQLMacros('$__range_s', ctx)).toBe('86400');
    expect(interpolatePromQLMacros('$__range_ms', ctx)).toBe('86400000');
  });

  it('supports the ${__macro} brace form and leaves other text untouched', () => {
    expect(interpolatePromQLMacros('rate(up[${__rate_interval}]) or vector(1)', ctx)).toBe(
      'rate(up[4m]) or vector(1)'
    );
  });

  it('does not partially match interval_ms as interval', () => {
    expect(interpolatePromQLMacros('$__interval_ms', ctx)).toBe('30000');
  });
});
