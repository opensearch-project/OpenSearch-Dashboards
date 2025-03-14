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
    timeField: {
      types: ['string'],
      help: '',
    },
  },
  async fn(input, args) {
    const hits = JSON.parse(args.hits) as OpenSearchSearchHit[];
    console.log('hits in discoverSearch', hits);

    // TODO: need to do more to formate the date fields in the rows
    const rows: OpenSearchDashboardsDatatableRow[] = hits.map((row: OpenSearchSearchHit) => {
      return row._source as OpenSearchDashboardsDatatableRow;
    }) as any;

    // const columns = [
    //   {
    //     id: args.timeField, // TODO: get the time field
    //     name: args.timeField,
    //   },
    // ] as OpenSearchDashboardsDatatableColumn[];

    // Object.keys(rows[0]).forEach((key: string) => {
    //   columns.push({
    //     id: key,
    //     name: key,
    //   });
    //   return;
    // });

    const columns = Object.keys(rows[0]).map((key: string) => {
      return {
        id: key,
        name: key,
      };
    });

    const table: OpenSearchDashboardsDatatable = {
      type: 'opensearch_dashboards_datatable',
      rows,
      columns,
    };
    console.log('table in discoverSearch', table);

    return table;
  },
});
