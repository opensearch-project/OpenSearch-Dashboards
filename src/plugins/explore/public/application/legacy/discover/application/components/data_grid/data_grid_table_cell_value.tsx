/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './data_grid_table_cell_value.scss';

import React, { Fragment } from 'react';
import dompurify from 'dompurify';

import {
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { stringify } from '@osd/std';
import { IndexPattern } from '../../../opensearch_dashboards_services';
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
