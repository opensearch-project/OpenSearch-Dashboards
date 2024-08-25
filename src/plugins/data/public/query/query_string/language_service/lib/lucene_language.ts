/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from '../types';
import { ISearchInterceptor } from '../../../../search';

export const getLuceneLanguageConfig = (search: ISearchInterceptor): LanguageConfig => {
  return {
    id: 'lucene',
    title: 'Lucene',
    search,
    searchBar: {
      showDataSetsSelector: true,
      showDataSourcesSelector: false,
      showQueryInput: true,
      showFilterBar: true,
      showDatePicker: true,
      showAutoRefreshOnly: false,
      queryStringInput: {
        initialValue: '',
      },
    },
    fields: {
      filterable: true,
      visualizable: true,
    },
    showDocLinks: true,
    supportedAppNames: ['discover'],
  };
};
