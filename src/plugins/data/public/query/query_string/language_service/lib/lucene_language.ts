/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSearchService } from '../../../../services';
import { LanguageConfig } from '../types';

export const luceneLanguageConfig: LanguageConfig = {
  id: 'lucene',
  title: 'Lucene',
  search: getSearchService().getDefaultSearchInterceptor(),
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
