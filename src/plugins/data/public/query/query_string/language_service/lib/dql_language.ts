/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from '../types';
import { ISearchInterceptor } from '../../../../search';

export const getDQLLanguageConfig = (search: ISearchInterceptor): LanguageConfig => {
  return {
    id: 'kuery',
    title: 'DQL',
    search,
    getQueryString(_) {
      return '';
    },
    searchBar: {
      showQueryInput: true,
      showFilterBar: true,
      showDatePicker: true,
      showAutoRefreshOnly: false,
    },
    fields: {
      filterable: true,
      visualizable: true,
    },
    showDocLinks: true,
    supportedAppNames: ['discover'],
  };
};
