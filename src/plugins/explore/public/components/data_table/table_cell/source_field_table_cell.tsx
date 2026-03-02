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

import './source_field_table_cell.scss';

import React, { Fragment } from 'react';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { shortenDottedString } from '../../../helpers/shorten_dotted_string';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

export interface SourceFieldTableCellProps {
  colName: string;
  dataset: IndexPattern | Dataset;
  row: OpenSearchSearchHit<Record<string, unknown>>;
  isShortDots: boolean;
  wrapCellText?: boolean;
}

const SourceFieldTableCellComponent: React.FC<SourceFieldTableCellProps> = ({
  colName,
  dataset,
  row,
  isShortDots,
  wrapCellText,
}) => {
  const formattedRow = dataset.formatHit(row, 'text');
  const metaFields = dataset.metaFields || [];
  const rawKeys = Object.keys(formattedRow).filter((key) => !metaFields.includes(key));
  const keys = isShortDots ? rawKeys.map((k) => shortenDottedString(k)) : rawKeys;

  return (
    <td
      key={colName}
      className={`exploreDocTableCell${
        wrapCellText ? '' : ' eui-textTruncate'
      } exploreDocTableCell__source`}
      data-test-subj="docTableField"
    >
      <div className="exploreDocTableCell__content">
        <span className="source">
          {keys.map((key, index) => (
            <Fragment key={key}>
              <span className="source__key" data-test-subj="sourceFieldKey">
                {key}:
              </span>
              <span className="source__value" data-test-subj="sourceFieldValue">
                {formattedRow[rawKeys[index]]}
              </span>
              {index !== keys.length - 1 && ' '}
            </Fragment>
          ))}
        </span>
      </div>
    </td>
  );
};

export const SourceFieldTableCell = React.memo(SourceFieldTableCellComponent);
