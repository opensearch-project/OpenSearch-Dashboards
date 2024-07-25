/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { JobState, parseJobState } from './types';

describe('parseJobState', () => {
  it('should return the correct JobState for a valid string', () => {
    expect(parseJobState('SUBMITTED')).toBe(JobState.SUBMITTED);
    expect(parseJobState('waiting')).toBe(JobState.WAITING);
    expect(parseJobState('SCHEDULED')).toBe(JobState.SCHEDULED);
    expect(parseJobState('running')).toBe(JobState.RUNNING);
    expect(parseJobState('FAILED')).toBe(JobState.FAILED);
    expect(parseJobState('success')).toBe(JobState.SUCCESS);
    expect(parseJobState('CANCELLING')).toBe(JobState.CANCELLING);
    expect(parseJobState('cancelled')).toBe(JobState.CANCELLED);
  });

  it('should return null for an invalid string', () => {
    expect(parseJobState('invalid')).toBeNull();
    expect(parseJobState('INVALID')).toBeNull();
  });

  it('should return null for non-string values', () => {
    expect(parseJobState(123)).toBeNull();
    expect(parseJobState(true)).toBeNull();
    expect(parseJobState(null)).toBeNull();
    expect(parseJobState(undefined)).toBeNull();
    expect(parseJobState({})).toBeNull();
    expect(parseJobState([])).toBeNull();
  });
});
