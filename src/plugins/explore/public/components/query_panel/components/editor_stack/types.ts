/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { TimeRange } from 'src/plugins/data/common';

export enum EditorType {
  Query = 'query',
  Prompt = 'prompt',
}

export enum LanguageType {
  Natural = 'plaintext',
  KeyValue = 'PPL',
  PPL = 'PPL',
}

export interface PromptResponse {
  query: string;
  timeRange?: TimeRange;
}

export interface PromptParameters {
  question: string;
  index: string;
  language: string;
  // for MDS
  dataSourceId?: string;
}

export enum PromptContextType {
  QUESTION,
  QUERY,
  DATA,
}

export enum FeedbackStatus {
  NONE = 'none',
  THUMB_UP = 'thumbup',
  THUMB_DOWN = 'thumbdown',
}
