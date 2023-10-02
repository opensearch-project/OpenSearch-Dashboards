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

import { isObject } from 'lodash';
// @ts-ignore
import { saveAs } from '@elastic/filesaver';
import { CoreStart } from 'opensearch-dashboards/public';
import { CSV_SEPARATOR_SETTING, CSV_QUOTE_VALUES_SETTING } from '../../../share/public';
import { OpenSearchDashboardsDatatable } from '../../../expressions/public';
import { FormattedColumn } from '../types';

const nonAlphaNumRE = /[^a-zA-Z0-9]/;
const allDoubleQuoteRE = /"/g;

interface CSVDataProps {
  filename?: string;
  rows: OpenSearchDashboardsDatatable['rows'];
  columns: FormattedColumn[];
  uiSettings: CoreStart['uiSettings'];
}

export const toCsv = function (formatted: boolean, { rows, columns, uiSettings }: CSVDataProps) {
  const separator = uiSettings.get(CSV_SEPARATOR_SETTING);
  const quoteValues = uiSettings.get(CSV_QUOTE_VALUES_SETTING);

  function escape(val: any) {
    if (!formatted && isObject(val)) val = val.valueOf();
    val = String(val);
    if (quoteValues && nonAlphaNumRE.test(val)) {
      val = '"' + val.replace(allDoubleQuoteRE, '""') + '"';
    }
    return val;
  }

  let csvRows: string[][] = [];
  for (const row of rows) {
    const rowArray = [];
    for (const col of columns) {
      const value = row[col.id];
      const formattedValue =
        formatted && col.formatter ? escape(col.formatter.convert(value)) : escape(value);
      rowArray.push(formattedValue);
    }
    csvRows = [...csvRows, rowArray];
  }

  // add the columns to the rows
  csvRows.unshift(columns.map((col) => escape(col.title)));

  return csvRows.map((row) => row.join(separator) + '\r\n').join('');
};

export const exportAsCsv = function (formatted: boolean, csvData: CSVDataProps) {
  const csv = new Blob([toCsv(formatted, csvData)], { type: 'text/csv;charset=utf-8' });
  const type = formatted ? 'formatted' : 'raw';
  if (csvData.filename) saveAs(csv, `${csvData.filename}-${type}.csv`);
  else saveAs(csv, `unsaved-${type}.csv`);
};
