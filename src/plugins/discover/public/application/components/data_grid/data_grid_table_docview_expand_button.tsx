/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiToolTip, EuiButtonIcon, EuiDataGridCellValueElementProps } from '@elastic/eui';
import { useDataGridContext } from './data_grid_table_context';
import { setAnchorId, useDispatch, useSelector } from '../../utils/state_management';

export const DocViewExpandButton = ({
  rowIndex,
  setCellProps,
}: EuiDataGridCellValueElementProps) => {
  const { expandedHit, setExpandedHit, rows, setDetailFlyoutOpen } = useDataGridContext();
  const currentExpanded = rows[rowIndex];
  const isCurrentExpanded = currentExpanded === expandedHit;
  const onClick = () => {
    setExpandedHit(isCurrentExpanded ? undefined : currentExpanded);
    setDetailFlyoutOpen(true);
  };

  return (
    <EuiToolTip content={`Expand row ${rowIndex}`}>
      <EuiButtonIcon
        onClick={onClick}
        iconType={isCurrentExpanded ? 'minimize' : 'expand'}
        aria-label={`Expand row ${rowIndex}`}
      />
    </EuiToolTip>
  );
};
