/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_table_header.scss';

import React from 'react';
import { TableHeaderColumn } from './table_header_column';
import { LegacyDisplayedColumn } from '../../../helpers/data_table_helper';

interface Props {
  displayedColumns: LegacyDisplayedColumn[];
  onRemoveColumn?: (name: string) => void;
}

export function TableHeader({ displayedColumns, onRemoveColumn }: Props) {
  return (
    <tr data-test-subj="docTableHeader" className="exploreDocTableHeader">
      <th style={{ width: '28px' }} />
      {displayedColumns.map((col) => {
        return (
          <TableHeaderColumn
            key={col.name}
            displayName={col.displayName}
            isRemoveable={col.isRemoveable}
            name={col.name}
            onRemoveColumn={onRemoveColumn}
          />
        );
      })}
    </tr>
  );
}
