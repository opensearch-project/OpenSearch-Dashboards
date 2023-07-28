/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { EuiToolTip, EuiButtonIcon, EuiDataGridCellValueElementProps } from '@elastic/eui';
import { DataGridContext } from './data_grid_table_context';

export const DocViewExpandButton = ({
  rowIndex,
  setCellProps,
}: EuiDataGridCellValueElementProps) => {
  const { docViewExpand, setDocViewExpand, rows } = useContext(DataGridContext);
  const currentExpanded = rows[rowIndex];
  const isCurrentExpanded = currentExpanded === docViewExpand;

  return (
    <EuiToolTip content={`Expand row ${rowIndex}`}>
      <EuiButtonIcon
        onClick={() => setDocViewExpand(isCurrentExpanded ? undefined : currentExpanded)}
        iconType={isCurrentExpanded ? 'minimize' : 'expand'}
        aria-label={`Expand row ${rowIndex}`}
      />
    </EuiToolTip>
  );
};
