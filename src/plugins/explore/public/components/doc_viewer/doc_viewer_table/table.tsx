/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import './table.scss';
import { DocViewRenderProps } from '../../../types/doc_views_types';
import { DocViewTableRowContainer } from './table_row/table_row_container';

export function DocViewTable({
  hit,
  indexPattern,
  filter,
  columns,
  onAddColumn,
  onRemoveColumn,
}: DocViewRenderProps) {
  const flattened = indexPattern.flattenHit(hit);

  return (
    <table
      className="table table-condensed exploreDocViewerTable"
      data-test-subj="osdDocViewerTable"
    >
      <tbody>
        {Object.keys(flattened)
          .sort()
          .map((field) => {
            return (
              <DocViewTableRowContainer
                hit={hit}
                indexPattern={indexPattern}
                filter={filter}
                columns={columns}
                onAddColumn={onAddColumn}
                onRemoveColumn={onRemoveColumn}
                field={field}
              />
            );
          })}
      </tbody>
    </table>
  );
}
