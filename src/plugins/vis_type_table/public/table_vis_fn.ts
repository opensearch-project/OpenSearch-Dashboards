/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { tableVisResponseHandler, TableVisData } from './table_vis_response_handler';
import {
  ExpressionFunctionDefinition,
  OpenSearchDashboardsDatatable,
  Render,
} from '../../expressions/public';
import { TableVisConfig } from './types';

export type Input = OpenSearchDashboardsDatatable;

interface Arguments {
  visConfig: string | null;
}

export interface TableVisRenderValue {
  visData: TableVisData;
  visType: 'table';
  visConfig: TableVisConfig;
}

export type TableVisExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'opensearch_dashboards_table',
  Input,
  Arguments,
  Render<TableVisRenderValue>
>;

export const createTableVisFn = (): TableVisExpressionFunctionDefinition => ({
  name: 'opensearch_dashboards_table',
  type: 'render',
  inputTypes: ['opensearch_dashboards_datatable'],
  help: i18n.translate('visTypeTable.function.help', {
    defaultMessage: 'Table visualization',
  }),
  args: {
    visConfig: {
      types: ['string', 'null'],
      default: '"{}"',
      help: '',
    },
  },
  fn(input, args) {
    const visConfig = args.visConfig && JSON.parse(args.visConfig);
    const convertedData = tableVisResponseHandler(input, visConfig);

    return {
      type: 'render',
      as: 'table_vis',
      value: {
        visData: convertedData,
        visType: 'table',
        visConfig,
      },
    };
  },
});
