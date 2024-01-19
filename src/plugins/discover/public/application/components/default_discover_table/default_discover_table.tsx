/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_doc_table.scss';

import React, { useState, useMemo, useCallback } from 'react';
import { TableHeader } from './table_header';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TableRow } from './table_rows';

export const DefaultDiscoverTable = ({
  displayedTableColumns,
  rows,
  // dataGridTableColumnsVisibility,
  // leadingControlColumns,
  // pagination,
  // renderCellValue,
  // rowCount,
  // sorting,
  // isToolbarVisible,
  // toolbarVisibility,
  // rowHeightsOptions,
  indexPattern,
}) => {
  return (
    indexPattern && (
      <table data-test-subj="docTable" className="osd-table table">
        <thead>
          <TableHeader
            displayedTableColumns={displayedTableColumns}
            defaultSortOrder={''}
            // hideTimeColumn,
            indexPattern={indexPattern}
            // isShortDots,
            onChangeSortOrder={() => {}}
            onMoveColumn={() => {}}
            onRemoveColumn={() => {}}
            sortOrder={[]}
          />
        </thead>
        <tbody>
          {rows.map((row: OpenSearchSearchHit) => {
            return (
              <TableRow
                key={row._id}
                row={row}
                columns={displayedTableColumns}
                indexPattern={indexPattern}
              />
            );
          })}
        </tbody>
      </table>
    )
  );
};
