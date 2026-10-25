/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  formatProgressPercent,
  formatStreamingAnnotation,
  getStreamingPhase,
} from './format_streaming_annotation';
import { StreamingQueryStatus } from '../../../../application/utils/state_management/types';

const status = (overrides: Partial<StreamingQueryStatus>): StreamingQueryStatus =>
  ({ isPolling: false, ...overrides }) as StreamingQueryStatus;

describe('getStreamingPhase', () => {
  it('reports none for a non-streaming query', () => {
    expect(getStreamingPhase(undefined)).toBe('none');
  });

  it('reports polling while a job is in flight', () => {
    expect(getStreamingPhase(status({ isPolling: true }))).toBe('polling');
  });

  it('reports aborted for a job the user stopped', () => {
    expect(getStreamingPhase(status({ aborted: true }))).toBe('aborted');
  });

  it('reports completed for a job that finished on its own', () => {
    expect(getStreamingPhase(status({}))).toBe('completed');
  });
});

describe('formatProgressPercent', () => {
  it.each([
    [0, 0],
    [0.42, 42],
    [0.8, 80],
    [0.999, 99],
  ])('floors %p to %p', (fraction, expected) => {
    expect(formatProgressPercent(fraction)).toBe(expected);
  });

  it('caps at 100 so a fraction over 1 cannot overshoot', () => {
    expect(formatProgressPercent(1.2)).toBe(100);
  });

  it.each([undefined, NaN, Infinity, -1])('has no percentage for %p', (fraction) => {
    expect(formatProgressPercent(fraction as number)).toBeUndefined();
  });
});

describe('formatStreamingAnnotation', () => {
  it('says nothing for a non-streaming query', () => {
    expect(formatStreamingAnnotation(undefined)).toBe('');
  });

  it('reports progress while polling', () => {
    expect(formatStreamingAnnotation(status({ isPolling: true, fractionDone: 0.5 }))).toBe('50%');
  });

  it('says nothing while polling without reported progress', () => {
    expect(formatStreamingAnnotation(status({ isPolling: true }))).toBe('');
  });

  it('reports where a stopped query got to', () => {
    expect(formatStreamingAnnotation(status({ aborted: true, fractionDone: 0.72 }))).toBe(
      'Stopped at 72%'
    );
  });

  it('still reports a stop without reported progress', () => {
    expect(formatStreamingAnnotation(status({ aborted: true }))).toBe('Stopped');
  });

  it('leaves a completed query unmarked', () => {
    expect(formatStreamingAnnotation(status({ fractionDone: 1 }))).toBe('');
  });
});
