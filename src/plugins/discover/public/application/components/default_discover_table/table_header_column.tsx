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

import React, { ReactNode } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiDataGridSorting, EuiToolTip } from '@elastic/eui';

interface Props {
  currentIdx: number;
  colLeftIdx: number; // idx of the column to the left, -1 if moving is not possible
  colRightIdx: number; // idx of the column to the right, -1 if moving is not possible
  displayName: ReactNode;
  isRemoveable: boolean;
  isSortable?: boolean;
  name: string;
  onChangeSortOrder?: (cols: EuiDataGridSorting['columns']) => void;
  onMoveColumn?: (name: string, idx: number) => void;
  onReorderColumn?: (col: string, source: number, destination: number) => void;
  onRemoveColumn?: (name: string) => void;
  sortOrder: Array<{
    id: string;
    direction: 'desc' | 'asc';
  }>;
}

const sortDirectionToIcon: Record<string, string> = {
  desc: 'fa fa-sort-down',
  asc: 'fa fa-sort-up',
  '': 'fa fa-sort',
};

export function TableHeaderColumn({
  currentIdx,
  colLeftIdx,
  colRightIdx,
  displayName,
  isRemoveable,
  isSortable,
  name,
  onChangeSortOrder,
  onReorderColumn,
  onRemoveColumn,
  sortOrder,
}: Props) {
  const currentSortWithoutColumn = sortOrder.filter((pair) => pair.id !== name);
  const currentColumnSort = sortOrder.find((pair) => pair.id === name);
  const currentColumnSortDirection = (currentColumnSort && currentColumnSort.direction) || '';

  const btnSortIcon = sortDirectionToIcon[currentColumnSortDirection];
  const btnSortClassName =
    currentColumnSortDirection !== ''
      ? btnSortIcon
      : `osdDocTableHeader__sortChange ${btnSortIcon}`;

  const handleChangeSortOrder = () => {
    if (!onChangeSortOrder) return;

    let currentSortOrder;
    let newSortOrder: {
      id: string;
      direction: 'desc' | 'asc';
    };
    // Cycle goes Unsorted -> Asc -> Desc -> Unsorted
    if (currentColumnSort === undefined) {
      newSortOrder = {
        id: name,
        direction: 'asc',
      };
      currentSortOrder = [...currentSortWithoutColumn, newSortOrder];
      onChangeSortOrder(currentSortOrder);
    } else if (currentColumnSortDirection === 'asc') {
      newSortOrder = {
        id: name,
        direction: 'desc',
      };
      currentSortOrder = [...currentSortWithoutColumn, newSortOrder];
      onChangeSortOrder(currentSortOrder);
    } else if (currentColumnSortDirection === 'desc' && currentSortWithoutColumn.length === 0) {
      // If we're at the end of the cycle and this is the only existing sort, we switch
      // back to ascending sort instead of removing it.
      newSortOrder = {
        id: name,
        direction: 'asc',
      };
      currentSortOrder = [...currentSortWithoutColumn, newSortOrder];
      onChangeSortOrder(currentSortOrder);
    } else {
      onChangeSortOrder(currentSortWithoutColumn);
    }
  };

  const getSortButtonAriaLabel = () => {
    const sortAscendingMessage = i18n.translate(
      'discover.docTable.tableHeader.sortByColumnAscendingAriaLabel',
      {
        defaultMessage: 'Sort {columnName} ascending',
        values: { columnName: name },
      }
    );
    const sortDescendingMessage = i18n.translate(
      'discover.docTable.tableHeader.sortByColumnDescendingAriaLabel',
      {
        defaultMessage: 'Sort {columnName} descending',
        values: { columnName: name },
      }
    );
    const stopSortingMessage = i18n.translate(
      'discover.docTable.tableHeader.sortByColumnUnsortedAriaLabel',
      {
        defaultMessage: 'Stop sorting on {columnName}',
        values: { columnName: name },
      }
    );

    if (currentColumnSort === undefined) {
      return sortAscendingMessage;
    } else if (currentColumnSortDirection === 'asc') {
      return sortDescendingMessage;
    } else if (currentColumnSortDirection === 'desc' && currentSortWithoutColumn.length === 0) {
      return sortAscendingMessage;
    } else {
      return stopSortingMessage;
    }
  };

  // action buttons displayed on the right side of the column name
  const buttons = [
    // Sort Button
    {
      active: isSortable && typeof onChangeSortOrder === 'function',
      ariaLabel: getSortButtonAriaLabel(),
      className: btnSortClassName,
      onClick: handleChangeSortOrder,
      testSubject: `docTableHeaderFieldSort_${name}`,
      tooltip: getSortButtonAriaLabel(),
      iconType: 'sortable',
    },
    // Remove Button
    {
      active: isRemoveable && typeof onRemoveColumn === 'function',
      ariaLabel: i18n.translate('discover.docTable.tableHeader.removeColumnButtonAriaLabel', {
        defaultMessage: 'Remove {columnName} column',
        values: { columnName: name },
      }),
      className: 'fa fa-remove osdDocTableHeader__move',
      onClick: () => onRemoveColumn && onRemoveColumn(name),
      testSubject: `docTableRemoveHeader-${name}`,
      tooltip: i18n.translate('discover.docTable.tableHeader.removeColumnButtonTooltip', {
        defaultMessage: 'Remove Column',
      }),
      iconType: 'cross',
    },
    // Move Left Button
    {
      active: colLeftIdx >= 0 && typeof onReorderColumn === 'function',
      ariaLabel: i18n.translate('discover.docTable.tableHeader.moveColumnLeftButtonAriaLabel', {
        defaultMessage: 'Move {columnName} column to the left',
        values: { columnName: name },
      }),
      className: 'fa fa-angle-double-left osdDocTableHeader__move',
      onClick: () => onReorderColumn && onReorderColumn(name, currentIdx, colLeftIdx),
      testSubject: `docTableMoveLeftHeader-${name}`,
      tooltip: i18n.translate('discover.docTable.tableHeader.moveColumnLeftButtonTooltip', {
        defaultMessage: 'Move column to the left',
      }),
      iconType: 'sortLeft',
    },
    // Move Right Button
    {
      active: colRightIdx >= 0 && typeof onReorderColumn === 'function',
      ariaLabel: i18n.translate('discover.docTable.tableHeader.moveColumnRightButtonAriaLabel', {
        defaultMessage: 'Move {columnName} column to the right',
        values: { columnName: name },
      }),
      className: 'fa fa-angle-double-right osdDocTableHeader__move',
      onClick: () => onReorderColumn && onReorderColumn(name, currentIdx, colRightIdx),
      testSubject: `docTableMoveRightHeader-${name}`,
      tooltip: i18n.translate('discover.docTable.tableHeader.moveColumnRightButtonTooltip', {
        defaultMessage: 'Move column to the right',
      }),
      iconType: 'sortRight',
    },
  ];

  return (
    <th data-test-subj="docTableHeaderField" className="docTableHeaderField">
      <span data-test-subj={`docTableHeader-${name}`}>
        {displayName}
        {buttons
          .filter((button) => button.active)
          .map((button, idx) => (
            <EuiToolTip
              id={`docTableHeader-${name}-tt`}
              content={button.tooltip}
              key={`button-${idx}`}
            >
              <EuiButtonIcon
                iconType={`${button.iconType}`}
                aria-label={button.ariaLabel}
                className="docTableHeaderField__actionButton"
                data-test-subj={button.testSubject}
                onClick={button.onClick}
                iconSize="s"
              />
            </EuiToolTip>
          ))}
      </span>
    </th>
  );
}
