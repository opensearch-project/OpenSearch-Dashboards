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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { OpenSearchDashboardsDatatableRow } from 'src/plugins/expressions';
import { Table } from '../table_vis_response_handler';
import { TableVisConfig } from '../types';
import { getFormatService } from '../services';
import { FormattedColumn } from '../types';
export interface FormattedDataProps {
  formattedRows: OpenSearchDashboardsDatatableRow[];
  formattedColumns: FormattedColumn[];
}

export const convertToFormattedData = (
  table: Table,
  visConfig: TableVisConfig
): FormattedDataProps => {
  const { buckets, metrics } = visConfig;
  const formattedRows: OpenSearchDashboardsDatatableRow[] = table.rows;
  const formattedColumns: FormattedColumn[] = table.columns
    .map(function (col, i) {
      const isBucket = buckets.find((bucket) => bucket.accessor === i);
      const dimension = isBucket || metrics.find((metric) => metric.accessor === i);

      if (!dimension) return undefined;

      const formatter = getFormatService().deserialize(dimension.format);

      const formattedColumn: FormattedColumn = {
        id: col.id,
        title: col.name,
        formatter,
        filterable: !!isBucket,
      };

      return formattedColumn;
    })
    .filter((column): column is FormattedColumn => !!column);

  return { formattedRows, formattedColumns };
};
