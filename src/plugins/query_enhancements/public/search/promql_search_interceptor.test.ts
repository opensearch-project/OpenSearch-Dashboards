/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { resolvePromQLMacroContext, resolveStepOptions } from './promql_search_interceptor';
import { ASSUMED_SCRAPE_INTERVAL, calculateStep, DEFAULT_RESOLUTION } from '../../common';

const bounds = (fromMs: number, toMs: number) => ({
  min: moment(fromMs),
  max: moment(toMs),
});

// 24h range
const START = 0;
const END = 24 * 60 * 60 * 1000;

describe('resolveStepOptions', () => {
  it('returns undefined when neither maxDataPoints nor minStep is set', () => {
    expect(
      resolveStepOptions({ query: 'up', language: 'PROMQL' }, bounds(START, END))
    ).toBeUndefined();
  });

  it('returns undefined when bounds are missing or non-positive', () => {
    expect(
      resolveStepOptions({ query: 'up', language: 'PROMQL', maxDataPoints: 100 }, {})
    ).toBeUndefined();
    expect(
      resolveStepOptions(
        { query: 'up', language: 'PROMQL', maxDataPoints: 100 },
        bounds(END, START)
      )
    ).toBeUndefined();
  });

  it('honors maxDataPoints as the resolution', () => {
    const result = resolveStepOptions(
      { query: 'up', language: 'PROMQL', maxDataPoints: 100 },
      bounds(START, END)
    );
    expect(result).toEqual({ step: calculateStep(END - START, 100, 15) });
  });

  it('parses minStep duration strings into a seconds floor', () => {
    const result = resolveStepOptions(
      { query: 'up', language: 'PROMQL', minStep: '5m' },
      bounds(START, END)
    );
    expect(result).toEqual({ step: calculateStep(END - START, DEFAULT_RESOLUTION, 300) });
  });

  it('falls back to defaults for invalid minStep and non-positive maxDataPoints', () => {
    const result = resolveStepOptions(
      { query: 'up', language: 'PROMQL', minStep: 'not-a-duration', maxDataPoints: 0 },
      bounds(START, END)
    );
    expect(result).toEqual({ step: calculateStep(END - START, DEFAULT_RESOLUTION, 15) });
  });
});

describe('resolvePromQLMacroContext', () => {
  it('returns undefined when bounds are missing or non-positive', () => {
    expect(resolvePromQLMacroContext({ query: 'up', language: 'PROMQL' }, {})).toBeUndefined();
    expect(
      resolvePromQLMacroContext({ query: 'up', language: 'PROMQL' }, bounds(END, START))
    ).toBeUndefined();
  });

  it('derives step and range with default resolution and assumed scrape interval', () => {
    expect(
      resolvePromQLMacroContext({ query: 'up', language: 'PROMQL' }, bounds(START, END))
    ).toEqual({
      stepSec: calculateStep(END - START, DEFAULT_RESOLUTION, 15),
      rangeMs: END - START,
      scrapeSec: ASSUMED_SCRAPE_INTERVAL,
    });
  });

  it('uses a valid min step as both the step floor and the scrape interval', () => {
    expect(
      resolvePromQLMacroContext(
        { query: 'up', language: 'PROMQL', minStep: '1m' },
        bounds(START, END)
      )
    ).toEqual({
      stepSec: calculateStep(END - START, DEFAULT_RESOLUTION, 60),
      rangeMs: END - START,
      scrapeSec: 60,
    });
  });
});
