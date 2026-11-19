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
import { getDisplayValue } from '../../../../../data/common';
import { shortenDottedString } from '../../../helpers/shorten_dotted_string';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

// Internal metadata field injected by the data importer on lookup rows (the per-import UUID the
// filtered alias matches on). Kept in sync with the data_importer plugin's LOOKUP_FIELD by
// convention — a stable data contract — to avoid an explore -> data_importer plugin dependency.
const LOOKUP_METADATA_FIELD = '__lookup';

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
  // The data importer injects `__lookup` (a per-import UUID) on lookup rows. It's internal
  // metadata — like _id/_index/_score it adds no value inline and just eats horizontal space in
  // the _source summary — so exclude it here. It stays visible in the expanded document view,
  // which renders the full hit (including other metadata) through a separate path.
  const hiddenSourceFields = [...metaFields, LOOKUP_METADATA_FIELD];
  const rawKeys = Object.keys(formattedRow).filter((key) => !hiddenSourceFields.includes(key));
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
                {getDisplayValue(rawKeys[index], formattedRow[rawKeys[index]], row.highlight)}
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
