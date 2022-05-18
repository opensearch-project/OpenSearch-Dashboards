/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../opensearch_dashboards_utils/common';
import { DataPublicPluginStart } from '../../data/public';

export const [getAggService, setAggService] = createGetterSetter<
  DataPublicPluginStart['search']['aggs']
>('data.search.aggs');

export const [getIndexPatterns, setIndexPatterns] = createGetterSetter<
  DataPublicPluginStart['indexPatterns']
>('data.indexPatterns');
