/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const INDEX_PATTERN_STEP = 'INDEX_PATTERN_STEP';
export const TIME_FIELD_STEP = 'TIME_FIELD_STEP';
export const DATA_SOURCE_STEP = 'DATA_SOURCE_STEP';

const CREATION_FLOW_WITH_DATA_SOURCE_MAP = new Map();
CREATION_FLOW_WITH_DATA_SOURCE_MAP.set(DATA_SOURCE_STEP, {
  next: INDEX_PATTERN_STEP,
  prev: null,
  stepNumber: 1,
});
CREATION_FLOW_WITH_DATA_SOURCE_MAP.set(INDEX_PATTERN_STEP, {
  next: TIME_FIELD_STEP,
  prev: DATA_SOURCE_STEP,
  stepNumber: 2,
});
CREATION_FLOW_WITH_DATA_SOURCE_MAP.set(TIME_FIELD_STEP, {
  next: null,
  prev: INDEX_PATTERN_STEP,
  stepNumber: 3,
});

const DEFAULT_CREATION_FLOW_MAP = new Map();
DEFAULT_CREATION_FLOW_MAP.set(INDEX_PATTERN_STEP, {
  next: TIME_FIELD_STEP,
  prev: null,
  stepNumber: 1,
});
DEFAULT_CREATION_FLOW_MAP.set(TIME_FIELD_STEP, {
  next: null,
  prev: INDEX_PATTERN_STEP,
  stepNumber: 2,
});

export type StepType = 'INDEX_PATTERN_STEP' | 'TIME_FIELD_STEP' | 'DATA_SOURCE_STEP';

export const getInitialStepName = (dataSourceEnabled: boolean) => {
  if (dataSourceEnabled) {
    return DATA_SOURCE_STEP;
  }

  return INDEX_PATTERN_STEP;
};

export const getNextStep = (currentStep: StepType, dataSourceEnabled: boolean): StepType | null => {
  if (dataSourceEnabled) {
    return CREATION_FLOW_WITH_DATA_SOURCE_MAP.get(currentStep).next;
  }

  return DEFAULT_CREATION_FLOW_MAP.get(currentStep).next;
};

export const getPrevStep = (currentStep: StepType, dataSourceEnabled: boolean): StepType | null => {
  if (dataSourceEnabled) {
    return CREATION_FLOW_WITH_DATA_SOURCE_MAP.get(currentStep).prev;
  }

  return DEFAULT_CREATION_FLOW_MAP.get(currentStep).prev;
};

export const getCurrentStepNumber = (currentStep: StepType, dataSourceEnabled: boolean): number => {
  if (dataSourceEnabled) {
    return CREATION_FLOW_WITH_DATA_SOURCE_MAP.get(currentStep).stepNumber;
  }

  return DEFAULT_CREATION_FLOW_MAP.get(currentStep).stepNumber;
};

export const getTotalStepNumber = (dataSourceEnabled: boolean): number => {
  if (dataSourceEnabled) {
    return CREATION_FLOW_WITH_DATA_SOURCE_MAP.size;
  }

  return DEFAULT_CREATION_FLOW_MAP.size;
};
