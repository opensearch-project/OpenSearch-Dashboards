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

import { FtrProviderContext } from '../ftr_provider_context';

interface TabbedGridData {
  columns: string[];
  rows: string[][];
}

export function DataGridProvider({ getService }: FtrProviderContext) {
  const find = getService('find');

  class DataGrid {
    async getDataGridTableData(): Promise<TabbedGridData> {
      const table = await find.byCssSelector('.euiDataGrid');
      const $ = await table.parseDomContent();

      const columns = $('.euiDataGridHeaderCell__content')
        .toArray()
        .map((cell) => $(cell).text());

      const rows: string[][] = [];
      let rowIdx = -1;
      $.findTestSubjects('dataGridRowCell')
        .toArray()
        .forEach((cell) => {
          const cCell = $(cell);
          if (cCell.hasClass('euiDataGridRowCell--firstColumn')) {
            rows.push([]);
            rowIdx = rows.length - 1;
          }

          rows[rowIdx].push(cCell.find('.euiDataGridRowCell__truncate').text());
        });

      return {
        columns,
        rows,
      };
    }
  }

  return new DataGrid();
}
