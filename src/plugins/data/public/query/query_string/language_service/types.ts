/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchInterceptor } from '../../../search';
import { Query } from '../../../../public';
import { EditorInstance } from '../../../ui/query_editor/editors';

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
  editorSupportedAppNames?: string[];
}
