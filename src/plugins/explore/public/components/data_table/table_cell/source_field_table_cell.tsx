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
import dompurify from 'dompurify';
import {
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { shortenDottedString } from '../../../helpers/shorten_dotted_string';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

export interface SourceFieldTableCellProps {
  colName: string;
  dataset: IndexPattern | Dataset;
  row: OpenSearchSearchHit<Record<string, unknown>>;
  isShortDots: boolean;
}

export const SourceFieldTableCell: React.FC<SourceFieldTableCellProps> = ({
  colName,
  dataset,
  row,
  isShortDots,
}) => {
  const formattedRow = dataset.formatHit(row);
  const rawKeys = Object.keys(formattedRow);
  const keys = isShortDots ? rawKeys.map((k) => shortenDottedString(k)) : rawKeys;

  return (
    <td
      key={colName}
      className="exploreDocTableCell eui-textBreakAll eui-textBreakWord exploreDocTableCell__source"
      data-test-subj="docTableField"
    >
      <div className="truncate-by-height">
        <EuiDescriptionList type="inline" compressed className="source exploreTableSourceCell">
          {keys.map((key, index) => (
            <Fragment key={key}>
              <EuiDescriptionListTitle
                className="exploreDescriptionListFieldTitle"
                data-test-subj="dscDataGridTableCellListFieldTitle"
              >
                {key + ':'}
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription
                dangerouslySetInnerHTML={{
                  __html: dompurify.sanitize(formattedRow[rawKeys[index]]),
                }}
              />
              {index !== keys.length - 1 && ' '}
            </Fragment>
          ))}
        </EuiDescriptionList>
      </div>
    </td>
  );
};
