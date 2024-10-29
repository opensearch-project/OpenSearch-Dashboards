/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimeRange } from 'src/plugins/data/common';

export interface QueryAssistResponse {
  query: string;
  timeRange?: TimeRange;
}

export interface QueryAssistParameters {
  question: string;
  index: string;
  language: string;
  // for MDS
  dataSourceId?: string;
}

export enum QueryAssistContextType {
  QUESTION,
  QUERY,
  DATA,
}

export enum FeedbackStatus {
  NONE = 'none',
  THUMB_UP = 'thumbup',
  THUMB_DOWN = 'thumbdown',
}
