/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { Moment } from 'moment';
import { Dataset } from 'src/plugins/data/common';

export enum EditorMode {
  SinglePrompt = 'single-prompt', // Single Editor mode with prompt language
  SingleQuery = 'single-query', // Single Editor mode with prompt language
  DualPrompt = 'dual-prompt', // Dual Editor mode with prompt enabled and query disabled
  DualQuery = 'dual-query', // Dual Editor mode with query enabled and prompt disabled
}

export interface RefreshInterval {
  pause: boolean;
  value: number;
}

// eslint-disable-next-line
export type TimeRange = {
  from: string;
  to: string;
  mode?: 'absolute' | 'relative';
};
export interface TimeRangeBounds {
  min: Moment | undefined;
  max: Moment | undefined;
}

export enum EditorLanguage {
  Natural = 'plaintext',
  // TODO: Add support for key-value?
  PPL = 'PPL',
}

// eslint-disable-next-line
export type Query = {
  query: string | { [key: string]: any };
  language: string;
  dataset?: Dataset;
};
export interface RecentQueryItem {
  id: number;
  query: Query;
  time: number;
  timeRange?: TimeRange;
}

export interface RecentQueryTableItem {
  id: number;
  query: Query['query'];
  time: string;
}

export interface RecentQueriesTableProps {
  onClickRecentQuery: (query: Query, timeRange?: TimeRange) => void;
  isVisible: boolean;
  languageType: string;
}

export enum ResultStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading', // initial data load
  READY = 'ready', // results came back
  NO_RESULTS = 'none', // no results came back
  ERROR = 'error', // error occurred
}

export enum EditorType {
  Query = 'query',
  Prompt = 'prompt',
}
