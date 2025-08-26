/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATA_SOURCE_STEP,
  getInitialStepName,
  getNextStep,
  getPrevStep,
  getTotalStepNumber,
  INDEX_PATTERN_STEP,
  TIME_FIELD_STEP,
} from './creation_flow';

describe('getInitialStepName', () => {
  it('should get correct first step base on different flow', () => {
    expect(getInitialStepName(false)).toEqual(INDEX_PATTERN_STEP);
    expect(getInitialStepName(true)).toEqual(DATA_SOURCE_STEP);
  });
});

describe('getTotalStepNumber', () => {
  it('should get correct total number base on different flow', () => {
    expect(getTotalStepNumber(false)).toEqual(2);
    expect(getTotalStepNumber(true)).toEqual(3);
  });
});

describe('getNextStep', () => {
  it('should get correct next step base on different flow', () => {
    expect(getNextStep(INDEX_PATTERN_STEP, false)).toEqual(TIME_FIELD_STEP);
    expect(getNextStep(INDEX_PATTERN_STEP, true)).toEqual(TIME_FIELD_STEP);
    expect(getNextStep(DATA_SOURCE_STEP, true)).toEqual(INDEX_PATTERN_STEP);
  });
});

describe('getPrevStep', () => {
  it('should get correct previous step base on different flow', () => {
    expect(getPrevStep(TIME_FIELD_STEP, false)).toEqual(INDEX_PATTERN_STEP);
    expect(getPrevStep(INDEX_PATTERN_STEP, true)).toEqual(DATA_SOURCE_STEP);
    expect(getPrevStep(INDEX_PATTERN_STEP, false)).toEqual(null);
  });
});
