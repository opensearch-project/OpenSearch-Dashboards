/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchInterceptor } from '../../../search';
import {
  Query,
  QueryEditorExtensionConfig,
  QueryStringContract,
  TimeRange,
} from '../../../../public';
import { EditorInstance } from '../../../ui/query_editor/editors';

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
  queryString: QueryStringContract;
  onClickRecentQuery: (query: Query, timeRange?: TimeRange) => void;
  isVisible: boolean;
}

export interface EditorEnhancements {
  queryEditorExtension?: QueryEditorExtensionConfig;
}

export interface SampleQuery {
  title: string;
  query: string;
}

export interface LanguageConfig {
  id: string;
  title: string;
  search: ISearchInterceptor;
  getQueryString: (query: Query) => string;
  editor: (
    collapsedProps: any,
    expandedProps: any,
    bodyProps: any
  ) => EditorInstance<any, any, any>;
  fields?: {
    filterable?: boolean;
    visualizable?: boolean;
  };
  showDocLinks?: boolean;
  docLink?: {
    title: string;
    url: string;
  };
  editorSupportedAppNames?: string[];
  supportedAppNames?: string[];
  hideDatePicker?: boolean;
  sampleQueries?: SampleQuery[];
}
