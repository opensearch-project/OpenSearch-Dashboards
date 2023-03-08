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

import { getFormatService } from './services';
import { OpenSearchDashboardsDatatable } from '../../expressions/public';
import { TableVisConfig } from './types';

export interface Table {
  columns: OpenSearchDashboardsDatatable['columns'];
  rows: OpenSearchDashboardsDatatable['rows'];
}

export interface TableGroup {
  table: OpenSearchDashboardsDatatable;
  tables: Table[];
  title: string;
  name: string;
  key: any;
  column: number;
  row: number;
}

export interface TableContext {
  table?: Table;
  tableGroups: TableGroup[];
  direction?: 'row' | 'column';
}

export function tableVisResponseHandler(
  input: OpenSearchDashboardsDatatable,
  config: TableVisConfig
): TableContext {
  let table: Table | undefined;
  const tableGroups: TableGroup[] = [];
  let direction: TableContext['direction'];

  const split = config.splitColumn || config.splitRow;

  if (split) {
    direction = config.splitRow ? 'row' : 'column';
    const splitColumnIndex = split[0].accessor;
    const splitColumnFormatter = getFormatService().deserialize(split[0].format);
    const splitColumn = input.columns[splitColumnIndex];
    const splitMap: { [key: string]: number } = {};
    let splitIndex = 0;

    input.rows.forEach((row, rowIndex) => {
      const splitValue: any = row[splitColumn.id];

      if (!splitMap.hasOwnProperty(splitValue as any)) {
        (splitMap as any)[splitValue] = splitIndex++;
        const tableGroup: TableGroup = {
          title: `${splitColumnFormatter.convert(splitValue)}: ${splitColumn.name}`,
          name: splitColumn.name,
          key: splitValue,
          column: splitColumnIndex,
          row: rowIndex,
          table: input,
          tables: [],
        };

        tableGroup.tables.push({
          columns: input.columns,
          rows: [],
        });

        tableGroups.push(tableGroup);
      }

      const tableIndex = (splitMap as any)[splitValue];
      (tableGroups[tableIndex] as any).tables[0].rows.push(row);
    });
  } else {
    table = {
      columns: input.columns,
      rows: input.rows,
    };
  }

  return {
    table,
    tableGroups,
    direction,
  };
}
