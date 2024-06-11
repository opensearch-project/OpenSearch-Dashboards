/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import dompurify from 'dompurify';

import { OpenSearchDashboardsDatatableRow } from 'src/plugins/expressions';
import { FormattedColumn } from '../types';

export const getTableVisCellValue = (
  sortedRows: OpenSearchDashboardsDatatableRow[],
  columns: FormattedColumn[]
) => ({ rowIndex, columnId }: { rowIndex: number; columnId: string }) => {
  if (rowIndex < 0 || rowIndex >= sortedRows.length) {
    return null;
  }
  const row = sortedRows[rowIndex];
  if (!row || !row.hasOwnProperty(columnId)) {
    return null;
  }
  const rawContent = row[columnId];
  const colIndex = columns.findIndex((col) => col.id === columnId);
  const htmlContent = columns[colIndex].formatter.convert(rawContent, 'html');
  const formattedContent = (
    /*
     * Justification for dangerouslySetInnerHTML:
     * This is one of the visualizations which makes use of the HTML field formatters.
     * Since these formatters produce raw HTML, this visualization needs to be able to render them as-is, relying
     * on the field formatter to only produce safe HTML.
     * `htmlContent` is created by converting raw data via HTML field formatter, so we need to make sure this value never contains
     * any unsafe HTML (e.g. by bypassing the field formatter).
     */
    <div dangerouslySetInnerHTML={{ __html: dompurify.sanitize(htmlContent) }} /> // eslint-disable-line react/no-danger
  );
  return formattedContent || null;
};
