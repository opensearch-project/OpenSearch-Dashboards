/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from '../types';
import { getSearchService } from '../../../../services';

export const dqlLanguageConfig: LanguageConfig = {
  id: 'kuery',
  title: 'DQL',
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
