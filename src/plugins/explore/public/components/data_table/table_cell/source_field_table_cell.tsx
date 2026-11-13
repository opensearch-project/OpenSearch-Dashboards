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
import { EuiIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { isPlainObject } from 'lodash';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { getDisplayValue } from '../../../../../data/common';
import { shortenDottedString } from '../../../helpers/shorten_dotted_string';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

// Internal metadata field injected by the data importer on lookup rows (the per-import UUID the
// filtered alias matches on). Kept in sync with the data_importer plugin's LOOKUP_FIELD by
// convention — a stable data contract — to avoid an explore -> data_importer plugin dependency.
const LOOKUP_METADATA_FIELD = '__lookup';
const MAX_INLINE_SOURCE_FIELDS = 10;

function isParentContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return (
    isPlainObject(value) ||
    (Array.isArray(value) && value.some((entry) => isPlainObject(entry) || Array.isArray(entry)))
  );
}

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
  const flattened = dataset.flattenHit(row);
  const metaFields = dataset.metaFields || [];
  // The data importer injects `__lookup` (a per-import UUID) on lookup rows. It's internal
  // metadata — like _id/_index/_score it adds no value inline and just eats horizontal space in
  // the _source summary — so exclude it here. It stays visible in the expanded document view,
  // which renders the full hit (including other metadata) through a separate path.
  const hiddenSourceFields = [...metaFields, LOOKUP_METADATA_FIELD];
  const rawKeys = Object.keys(flattened).filter((key) => !hiddenSourceFields.includes(key));
  // Keep search matches visible even when they occur after the preview limit.
  const highlightedKeys = row.highlight
    ? rawKeys.filter((key) => row.highlight[key]?.length > 0)
    : [];
  const orderedKeys = highlightedKeys.length ? [...highlightedKeys, ...rawKeys] : rawKeys;

  const previewKeys: string[] = [];
  let hasMoreFields = false;
  for (const rawKey of orderedKeys) {
    if (previewKeys.includes(rawKey)) continue;
    // flattenHit retains some parent containers alongside their flattened children.
    if (
      isParentContainer(flattened[rawKey]) &&
      rawKeys.some((key) => key.startsWith(`${rawKey}.`))
    ) {
      continue;
    }
    if (previewKeys.length === MAX_INLINE_SOURCE_FIELDS) {
      hasMoreFields = true;
      break;
    }
    previewKeys.push(rawKey);
  }

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
          {previewKeys.map((rawKey, index) => {
            const key = isShortDots ? shortenDottedString(rawKey) : rawKey;
            const field = dataset.fields.getByName(rawKey) ?? { name: rawKey, type: 'string' };
            const formattedValue = dataset
              .getFormatterForField(field)
              .convert(flattened[rawKey], 'text', { field, hit: row, indexPattern: dataset });
            return (
              <Fragment key={rawKey}>
                <span className="source__key" data-test-subj="sourceFieldKey">
                  {key}:
                </span>
                <span className="source__value" data-test-subj="sourceFieldValue">
                  {getDisplayValue(rawKey, formattedValue, row.highlight)}
                </span>
                {index !== previewKeys.length - 1 && ' '}
              </Fragment>
            );
          })}
          {hasMoreFields && (
            <EuiToolTip
              anchorClassName="expSourcePreviewHint"
              content={i18n.translate('explore.defaultTable.sourceFieldPreviewTooltip', {
                defaultMessage: 'Expand the document to see all fields.',
              })}
            >
              <span data-test-subj="sourceFieldPreviewHint">
                <EuiIcon type="iInCircle" size="s" color="subdued" aria-hidden="true" />
              </span>
            </EuiToolTip>
          )}
        </span>
      </div>
    </td>
  );
};

export const SourceFieldTableCell = React.memo(SourceFieldTableCellComponent);
