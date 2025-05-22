import { LanguageType } from './components/editor_stack/shared';
import { Moment } from 'moment';

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

export type Query = {
  query: string | { [key: string]: any };
  language: LanguageType; // The language of the query (e.g., 'ppl', 'natural-language', etc.)
  prompt?: string;
  dataset?: string;
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
  languageType: LanguageType;
}
