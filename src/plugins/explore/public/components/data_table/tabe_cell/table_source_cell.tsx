/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './table_source_cell.scss';

import React, { Fragment } from 'react';
import dompurify from 'dompurify';

import {
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { IndexPattern } from 'src/plugins/data/public';
import { shortenDottedString } from '../../../helpers/shorten_dotted_string';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

export interface ITableSourceCellProps {
  idxPattern: IndexPattern;
  row: OpenSearchSearchHit<Record<string, unknown>>;
  isShortDots: boolean;
}

export const TableSourceCell = ({ idxPattern, row, isShortDots }: ITableSourceCellProps) => {
  const formattedRow = idxPattern.formatHit(row);
  const rawKeys = Object.keys(formattedRow);
  const keys = isShortDots ? rawKeys.map((k) => shortenDottedString(k)) : rawKeys;

  return (
    <EuiDescriptionList type="inline" compressed className="source">
      {keys.map((key, index) => (
        <Fragment key={key}>
          <EuiDescriptionListTitle
            className="exploreDescriptionListFieldTitle"
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
};
