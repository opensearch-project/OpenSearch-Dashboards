/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from '../types';
import { ISearchStart } from '../../../../search';

export const getLuceneLanguageConfig = (search: ISearchStart): LanguageConfig => {
  return {
    id: 'lucene',
    title: 'Lucene',
    search: search.getDefaultSearchInterceptor(),
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
