/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from '../types';
import { ISearchInterceptor } from '../../../../search';

export const getDQLLanguageConfig = (
  search: ISearchInterceptor,
  defaultEditor: any
): LanguageConfig => {
  return {
    id: 'kuery',
    title: 'DQL',
    search,
    getQueryString(_) {
      return '';
    },
    editor: defaultEditor,
    fields: {
      filterable: true,
      visualizable: true,
    },
    showDocLinks: true,
    editorSupportedAppNames: ['discover'],
  };
};
