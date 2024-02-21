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
  const testSubjects = getService('testSubjects');

  class DataGrid {
    // This test no longer works in the new data explorer data grid table
    // since each data grid table cell is now rendered differently
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5108
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

    /**
     * Retrieves the values from a data grid table.
     *
     * The function fetches values present in a data grid table and organizes them into rows and columns.
     * Each row is an array of strings, and the entire table is an array of such rows.
     *
     * @returns {Promise<string[][]>} A promise resolving to a 2D array of table values.
     */
    async getDataGridTableValues(): Promise<string[][]> {
      const table = await testSubjects.find('docTable');
      const $ = await table.parseDomContent();
      const cellsArr = $.findTestSubjects('dataGridRowCell').toArray();
      const rows: string[][] = [];
      let rowIdx = -1;

      for (const cell of cellsArr) {
        const cCell = $(cell);
        const isFirstColumn = cCell.attr('class').includes('euiDataGridRowCell--firstColumn');
        if (isFirstColumn) {
          rowIdx++;
          rows[rowIdx] = [];
        } else {
          rows[rowIdx].push(this.getTextFromCell(cCell));
        }
      }
      return Promise.resolve(rows);
    }

    /**
     * Retrieves the header fields of the data grid.
     *
     * @returns {Promise<string[]>} An array containing names of the header fields.
     */
    async getHeaderFields(): Promise<string[]> {
      const headerNames = [];
      // Locate header cells, ignoring the inspect document button column
      const headerCells = await find.allByCssSelector(
        '.euiDataGridHeaderCell__button > .euiDataGridHeaderCell__content'
      );

      for (const cell of headerCells) {
        const headerName = await cell.getAttribute('textContent');
        headerNames.push(headerName.trim());
      }
      return Promise.resolve(headerNames);
    }

    /**
     * Clicks to remove a specified column from the data grid.
     *
     * @param {string} columnName - The name of the column to be removed.
     */
    async clickRemoveColumn(columnName: string) {
      await testSubjects.click(`dataGridHeaderCell-${columnName}`);
      await find.clickByButtonText('Remove column');
    }

    /**
     * Retrieves values from a specific column in a data grid table.
     *
     * This function targets a column based on a CSS class selector and retrieves its cell values.
     * It makes use of the Cheerio library to parse and navigate the DOM.
     *
     * @param {string} selector - The CSS class suffix used to identify cells of the desired column.
     * @returns {Promise<string[]>} A promise resolving to an array of cell values from the specified column.
     */
    async getDataGridTableColumn(selector: string): Promise<string[]> {
      const table = await find.byCssSelector('.euiDataGrid');
      const $ = await table.parseDomContent();

      const columnValues: string[] = [];
      $.findTestSubjects('dataGridRowCell')
        .toArray()
        .forEach((cell) => {
          const cCell = $(cell);
          if (cCell.hasClass(`euiDataGridRowCell--${selector}`)) {
            // The column structure is very nested to get the actual text
            columnValues.push(this.getTextFromCell(cCell));
          }
        });

      return columnValues;
    }

    /**
     * Extracts the text from a cell in the data grid.
     *
     * Given a cell represented by a Cheerio object, this function navigates its nested structure
     * to extract the contained text.
     *
     * @param {any} cCell - The Cheerio representation of the cell from which text needs to be extracted.
     * @returns {string} The extracted text from the cell.
     */
    getTextFromCell(cCell: any): string {
      // navigate the nested structure and get the text
      return cCell.children().children().children().children().text();
    }
  }

  return new DataGrid();
}
