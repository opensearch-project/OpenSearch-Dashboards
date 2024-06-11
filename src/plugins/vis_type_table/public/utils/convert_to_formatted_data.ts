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

import { chain } from 'lodash';
import {
  OpenSearchDashboardsDatatableRow,
  OpenSearchDashboardsDatatableColumn,
} from 'src/plugins/expressions';
import { Table } from '../table_vis_response_handler';
import { AggTypes, TableVisConfig } from '../types';
import { getFormatService } from '../services';
import { FormattedColumn } from '../types';
import { addPercentageCol } from './add_percentage_col';

export interface FormattedDataProps {
  rows: OpenSearchDashboardsDatatableRow[];
  columns: OpenSearchDashboardsDatatableColumn[];
  formattedColumns: FormattedColumn[];
}

export const convertToFormattedData = (
  table: Table,
  visConfig: TableVisConfig
): FormattedDataProps => {
  const { buckets, metrics } = visConfig;
  let formattedRows: OpenSearchDashboardsDatatableRow[] = table.rows;
  let formattedColumns: FormattedColumn[] = table.columns
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

      const isDate = dimension?.format?.id === 'date' || dimension?.format?.params?.id === 'date';
      const allowsNumericalAggregations = formatter?.allowsNumericalAggregations;

      if (allowsNumericalAggregations || isDate || visConfig.totalFunc === AggTypes.COUNT) {
        // only calculate the sumTotal for numerical columns
        const sum = isBucket
          ? 0
          : table.rows.reduce((prev, curr) => {
              // some metrics return undefined for some of the values
              // derivative is an example of this as it returns undefined in the first row
              if (curr[col.id] === undefined) return prev;
              return prev + (curr[col.id] as number);
            }, 0);

        formattedColumn.sumTotal = sum;
        switch (visConfig.totalFunc) {
          case AggTypes.SUM: {
            if (!isDate) {
              formattedColumn.formattedTotal = formatter?.convert(sum);
              formattedColumn.total = formattedColumn.sumTotal;
            }
            break;
          }
          case AggTypes.AVG: {
            if (!isDate) {
              const total = sum / table.rows.length;
              formattedColumn.formattedTotal = formatter?.convert(total);
              formattedColumn.total = total;
            }
            break;
          }
          case AggTypes.MIN: {
            const total = chain(table.rows).map(col.id).min().value() as number;
            formattedColumn.formattedTotal = formatter?.convert(total);
            formattedColumn.total = total;
            break;
          }
          case AggTypes.MAX: {
            const total = chain(table.rows).map(col.id).max().value() as number;
            formattedColumn.formattedTotal = formatter?.convert(total);
            formattedColumn.total = total;
            break;
          }
          case 'count': {
            const total = table.rows.length;
            formattedColumn.formattedTotal = total;
            formattedColumn.total = total;
            break;
          }
          default:
            break;
        }
      }

      return formattedColumn;
    })
    .filter((column): column is FormattedColumn => !!column);

  if (visConfig.percentageCol) {
    const insertAtIndex = formattedColumns.findIndex(
      (col) => col.title === visConfig.percentageCol
    );

    // column to show percentage was removed
    if (insertAtIndex < 0) return { rows: table.rows, columns: table.columns, formattedColumns };

    const { cols, rows } = addPercentageCol(
      formattedColumns,
      visConfig.percentageCol,
      table.rows,
      insertAtIndex
    );
    formattedRows = rows;
    formattedColumns = cols;
  }
  return { rows: formattedRows, columns: table.columns, formattedColumns };
};
