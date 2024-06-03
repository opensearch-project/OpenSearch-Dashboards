import { TimeRange } from '../../../../src/plugins/data/common';

export const ERROR_DETAILS = { GUARDRAILS_TRIGGERED: 'guardrails triggered' };

export interface QueryAssistResponse {
  query: string;
  timeRange?: TimeRange;
}

export interface QueryAssistParameters {
  question: string;
  index: string;
  language: string;
}
