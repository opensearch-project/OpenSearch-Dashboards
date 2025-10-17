/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCheckbox, EuiSmallButtonIcon } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../../../common';
import {
  selectTabLogsExpandedRowsMap,
  selectTabLogsSelectedRowsMap,
} from '../../../../application/utils/state_management/selectors';
import {
  setExpandedRowState,
  setSelectedRowState,
} from '../../../../application/utils/state_management/slices';
import './column_actions_cell.scss';

export interface ExploreResultsTableColumnActionsCellProps {
  rowId: string;
}

export const ExploreResultsTableColumnActionsCell = ({
  rowId,
}: ExploreResultsTableColumnActionsCellProps) => {
  const flavorId = useFlavorId();
  const dispatch = useDispatch();
  const expandedRowsMap = useSelector(selectTabLogsExpandedRowsMap);
  const selectedRowsMap = useSelector(selectTabLogsSelectedRowsMap);
  const isExpanded: boolean = expandedRowsMap[rowId] ?? false;
  const isSelected: boolean = selectedRowsMap[rowId] ?? false;

  if (flavorId === ExploreFlavor.Traces) {
    return null;
  }

  return (
    <div className="exploreResultsTableColumnActionsCell">
      <EuiCheckbox
        className="exploreResultsTableColumnActionsCell__checkbox"
        id={`exploreResultsTableColumnActionsCell__checkbox${rowId}`}
        onChange={() => dispatch(setSelectedRowState({ id: rowId, state: !isSelected }))}
        aria-label={i18n.translate('explore.defaultTable.docTableExpandCheckboxColumnLabel', {
          defaultMessage: `Select row`,
        })}
        checked={isSelected}
      />
      <EuiSmallButtonIcon
        className="exploreResultsTableColumnActionsCell__toggle"
        color="text"
        onClick={() => dispatch(setExpandedRowState({ id: rowId, state: !isExpanded }))}
        iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
        aria-label={i18n.translate('explore.defaultTable.docTableExpandToggleColumnLabel', {
          defaultMessage: `Toggle row details`,
        })}
        data-test-subj="docTableExpandToggleColumn"
      />
    </div>
  );
};
