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

import './_table_header.scss';

import { i18n } from '@osd/i18n';
import React from 'react';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { TableHeaderColumn } from './table_header_column';
import { LegacyDisplayedColumn } from './helper';
import { getDefaultSort } from '../../view_components/utils/get_default_sort';
import { SortDirection, SortOrder } from '../../../saved_searches/types';

interface Props {
  displayedColumns: LegacyDisplayedColumn[];
  defaultSortOrder: SortDirection;
  indexPattern: IndexPattern;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onRemoveColumn?: (name: string) => void;
  onMoveColumn?: (colName: string, destination: number) => void;
  sortOrder: SortOrder[];
}

export function TableHeader({
  displayedColumns,
  defaultSortOrder,
  indexPattern,
  onChangeSortOrder,
  onMoveColumn,
  onRemoveColumn,
  sortOrder,
}: Props) {
  return (
    <tr data-test-subj="docTableHeader" className="osdDocTableHeader">
      <th style={{ width: '28px' }} />
      {displayedColumns.map((col) => {
        return (
          <TableHeaderColumn
            key={col.name}
            {...col}
            sortOrder={
              sortOrder.length ? sortOrder : getDefaultSort(indexPattern, defaultSortOrder)
            }
            onMoveColumn={onMoveColumn}
            onRemoveColumn={onRemoveColumn}
            onChangeSortOrder={onChangeSortOrder}
          />
        );
      })}
    </tr>
  );
}
