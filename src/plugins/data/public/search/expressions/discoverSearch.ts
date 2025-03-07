/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { i18n } from '@osd/i18n';
import {
  OpenSearchDashboardsDatatable,
  OpenSearchDashboardsDatatableColumn,
  OpenSearchDashboardsDatatableRow,
} from 'src/plugins/expressions/public';

import { DiscoverSearchExpressionFunctionDefinition, OpenSearchSearchHit } from '../../../common';
import { getIndexPatterns } from '../../services';

const name = 'discoverSearch';

export const discoverSearch = (): DiscoverSearchExpressionFunctionDefinition => ({
  name,
  type: 'opensearch_dashboards_datatable',
  inputTypes: ['null'],
  help: i18n.translate('data.functions.discoverSearch.help', {
    defaultMessage: 'Convert discover search response to a data table',
  }),
  args: {
    hits: {
      types: ['string'],
      help: '',
    },
  },
  async fn(input, args) {
    const hits = JSON.parse(args.hits) as OpenSearchSearchHit[];

    const columns: OpenSearchDashboardsDatatableColumn[] = hits[0]._source
      .keys()
      .forEach((key: string) => {
        return {
          id: key,
          name: key,
        };
      });
    const rows: OpenSearchDashboardsDatatableRow[] = hits.map((row: OpenSearchSearchHit) => {
      return row._source as OpenSearchDashboardsDatatableRow;
    });

    const table: OpenSearchDashboardsDatatable = {
      type: 'opensearch_dashboards_datatable',
      rows,
      columns,
    };

    return table;
  },
});
