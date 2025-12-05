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
import React, { ReactNode } from 'react';
import { EuiSmallButtonIcon, EuiToolTip } from '@elastic/eui';
import { SortOrder } from '../../../saved_searches/types';

interface Props {
  colLeftIdx: number; // idx of the column to the left, -1 if moving is not possible
  colRightIdx: number; // idx of the column to the right, -1 if moving is not possible
  displayName: ReactNode;
  isRemoveable: boolean;
  isSortable?: boolean;
  name: string;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onMoveColumn?: (colName: string, destination: number) => void;
  onRemoveColumn?: (name: string) => void;
  sortOrder: SortOrder[];
}

const sortDirectionToIcon: Record<string, string> = {
  desc: 'sortDown',
  asc: 'sortUp',
  '': 'sortable',
};

export function TableHeaderColumn({
  colLeftIdx,
  colRightIdx,
  displayName,
  isRemoveable,
  isSortable,
  name,
  onChangeSortOrder,
  onMoveColumn,
  onRemoveColumn,
  sortOrder,
}: Props) {
  const currentSortWithoutColumn = sortOrder.filter((pair) => pair[0] !== name);
  const currentColumnSort = sortOrder.find((pair) => pair[0] === name);
  const currentColumnSortDirection = (currentColumnSort && currentColumnSort[1]) || '';

  const btnSortIcon = sortDirectionToIcon[currentColumnSortDirection];
  const btnSortClassName =
    currentColumnSortDirection !== ''
      ? btnSortIcon
      : `osdDocTableHeader__sortChange ${btnSortIcon}`;

  const handleChangeSortOrder = () => {
    if (!onChangeSortOrder) return;

    // Cycle goes Unsorted -> Asc -> Desc -> Unsorted
    if (currentColumnSort === undefined) {
      onChangeSortOrder([...currentSortWithoutColumn, [name, 'asc']]);
    } else if (currentColumnSortDirection === 'asc') {
      onChangeSortOrder([...currentSortWithoutColumn, [name, 'desc']]);
    } else if (currentColumnSortDirection === 'desc' && currentSortWithoutColumn.length === 0) {
      // If we're at the end of the cycle and this is the only existing sort, we switch
      // back to ascending sort instead of removing it.
      onChangeSortOrder([...currentSortWithoutColumn, [name, 'asc']]);
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
      iconType: btnSortIcon,
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
      active: colLeftIdx >= 0 && typeof onMoveColumn === 'function',
      ariaLabel: i18n.translate('discover.docTable.tableHeader.moveColumnLeftButtonAriaLabel', {
        defaultMessage: 'Move {columnName} column to the left',
        values: { columnName: name },
      }),
      className: 'fa fa-angle-double-left osdDocTableHeader__move',
      onClick: () => onMoveColumn && onMoveColumn(name, colLeftIdx),
      testSubject: `docTableMoveLeftHeader-${name}`,
      tooltip: i18n.translate('discover.docTable.tableHeader.moveColumnLeftButtonTooltip', {
        defaultMessage: 'Move column to the left',
      }),
      iconType: 'sortLeft',
    },
    // Move Right Button
    {
      active: colRightIdx >= 0 && typeof onMoveColumn === 'function',
      ariaLabel: i18n.translate('discover.docTable.tableHeader.moveColumnRightButtonAriaLabel', {
        defaultMessage: 'Move {columnName} column to the right',
        values: { columnName: name },
      }),
      className: 'fa fa-angle-double-right osdDocTableHeader__move',
      onClick: () => onMoveColumn && onMoveColumn(name, colRightIdx),
      testSubject: `docTableMoveRightHeader-${name}`,
      tooltip: i18n.translate('discover.docTable.tableHeader.moveColumnRightButtonTooltip', {
        defaultMessage: 'Move column to the right',
      }),
      iconType: 'sortRight',
    },
  ];

  return (
    <th
      data-test-subj="docTableHeaderField"
      className="docTableHeaderField"
      role="columnheader"
      aria-label={i18n.translate('discover.defaultTable.docTableHeaderLabel', {
        defaultMessage: 'Discover table column: {name}',
        values: { name },
      })}
    >
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
              <EuiSmallButtonIcon
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
