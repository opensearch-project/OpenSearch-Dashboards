/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './data_grid_table_cell_value.scss';

import React, { Fragment } from 'react';
import dompurify from 'dompurify';

import {
  EuiDataGridCellValueElementProps,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { stringify } from '@osd/std';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { shortenDottedString } from '../../helpers';

export function fetchSourceTypeDataCell(
  idxPattern: IndexPattern,
  row: Record<string, unknown>,
  columnId: string,
  isDetails: boolean,
  isShortDots: boolean
) {
  if (isDetails) {
    return <span>{stringify(row[columnId], null, 2)}</span>;
  }
  const formattedRow = idxPattern.formatHit(row);
  const rawKeys = Object.keys(formattedRow);
  const keys = isShortDots ? rawKeys.map((k) => shortenDottedString(k)) : rawKeys;

  return (
    <EuiDescriptionList type="inline" compressed className="source">
      {keys.map((key, index) => (
        <Fragment key={key}>
          <EuiDescriptionListTitle
            className="osdDescriptionListFieldTitle"
            data-test-subj="dscDataGridTableCellListFieldTitle"
          >
            {key + ':'}
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription
            dangerouslySetInnerHTML={{ __html: dompurify.sanitize(formattedRow[key]) }}
          />
          {index !== keys.length - 1 && ' '}
        </Fragment>
      ))}
    </EuiDescriptionList>
  );
}

export const fetchTableDataCell = (
  idxPattern: IndexPattern,
  dataRows: OpenSearchSearchHit[] | undefined,
  isShortDots: boolean
) => ({ rowIndex, columnId, isDetails }: EuiDataGridCellValueElementProps) => {
  const singleRow = dataRows ? (dataRows[rowIndex] as Record<string, unknown>) : undefined;
  const flattenedRows = dataRows ? dataRows.map((hit) => idxPattern.flattenHit(hit)) : [];
  const flattenedRow = flattenedRows
    ? (flattenedRows[rowIndex] as Record<string, unknown>)
    : undefined;
  const fieldInfo = idxPattern.fields.getByName(columnId);

  if (typeof singleRow === 'undefined' || typeof flattenedRow === 'undefined') {
    return <span>-</span>;
  }

  if (!fieldInfo?.type && typeof flattenedRow?.[columnId] === 'object') {
    if (isDetails) {
      return <span>{stringify(flattenedRow[columnId], null, 2)}</span>;
    }

    return <span>{stringify(flattenedRow[columnId])}</span>;
  }

  if (fieldInfo?.type === '_source') {
    return fetchSourceTypeDataCell(idxPattern, singleRow, columnId, isDetails, isShortDots);
  }

  const formattedValue = idxPattern.formatField(singleRow, columnId);
  if (typeof formattedValue === 'undefined') {
    return <span>-</span>;
  } else {
    const sanitizedCellValue = dompurify.sanitize(formattedValue);
    return (
      // eslint-disable-next-line react/no-danger
      <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
    );
  }
};
