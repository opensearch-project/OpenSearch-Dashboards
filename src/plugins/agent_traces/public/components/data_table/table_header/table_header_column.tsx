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
import { ReactNode } from 'react';
import { EuiSmallButtonIcon, EuiToolTip } from '@elastic/eui';
import { SortOrder } from '../../../helpers/data_table_helper';

interface ColumnFieldMapping {
  label: string;
  field: string;
}

/** Returns raw-field mappings for agent traces default columns, or null for other columns. */
const getColumnFieldMappings = (
  columnName: string,
  displayName: ReactNode
): ColumnFieldMapping[] | null => {
  // Time column: displayName is 'Time' but columnName is the dataset's timeFieldName
  if (displayName === 'Time') {
    return [{ label: 'Time', field: columnName }];
  }
  switch (columnName) {
    case 'kind':
      return [{ label: 'Kind', field: 'attributes.gen_ai.operation.name' }];
    case 'name':
      return [{ label: 'Name', field: 'name' }];
    case 'status':
      return [{ label: 'Status', field: 'status.code' }];
    case 'latency':
      return [{ label: 'Latency', field: 'durationInNanos' }];
    case 'totalTokens':
      return [
        { label: 'Input token', field: 'attributes.gen_ai.usage.input_tokens' },
        { label: 'Output token', field: 'attributes.gen_ai.usage.output_tokens' },
      ];
    case 'input':
      return [{ label: 'Input', field: 'attributes.gen_ai.input.messages' }];
    case 'output':
      return [{ label: 'Output', field: 'attributes.gen_ai.output.messages' }];
    default:
      return null;
  }
};

const buildColumnTooltip = (columnName: string, displayName: ReactNode): ReactNode => {
  const mappings = getColumnFieldMappings(columnName, displayName);
  if (!mappings) return displayName;
  return (
    <div>
      <div>{displayName}</div>
      <hr
        style={{ margin: '4px 0', border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)' }}
      />
      {mappings.map((m) => (
        <div key={m.field}>
          {m.label}: {m.field}
        </div>
      ))}
    </div>
  );
};

const sortDirectionToIcon: Record<string, string> = {
  desc: 'sortDown',
  asc: 'sortUp',
  '': 'sortable',
};

interface Props {
  displayName: ReactNode;
  isRemoveable: boolean;
  isSortable?: boolean;
  name: string;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onRemoveColumn?: (name: string) => void;
  sortOrder?: SortOrder[];
}

export function TableHeaderColumn({
  displayName,
  isRemoveable,
  isSortable,
  name,
  onChangeSortOrder,
  onRemoveColumn,
  sortOrder = [],
}: Props) {
  const currentColumnSort = sortOrder.find((pair) => pair[0] === name);
  const currentColumnSortDirection = (currentColumnSort && currentColumnSort[1]) || '';

  const btnSortIcon = sortDirectionToIcon[currentColumnSortDirection];
  const btnSortClassName =
    currentColumnSortDirection !== '' ? '' : 'agentTracesDocTableHeader__sortChange';

  const handleChangeSortOrder = () => {
    if (!onChangeSortOrder) return;

    // Single-column sort only. Cycle: Unsorted → Asc → Desc → Unsorted
    if (currentColumnSort === undefined) {
      onChangeSortOrder([[name, 'asc']]);
    } else if (currentColumnSortDirection === 'asc') {
      onChangeSortOrder([[name, 'desc']]);
    } else {
      // desc → clear sorting (empty array triggers default time desc)
      onChangeSortOrder([]);
    }
  };

  const getSortButtonAriaLabel = () => {
    const sortAscendingMessage = i18n.translate(
      'agentTraces.docTable.tableHeader.sortByColumnAscendingAriaLabel',
      {
        defaultMessage: 'Sort {columnName} ascending',
        values: { columnName: name },
      }
    );
    const sortDescendingMessage = i18n.translate(
      'agentTraces.docTable.tableHeader.sortByColumnDescendingAriaLabel',
      {
        defaultMessage: 'Sort {columnName} descending',
        values: { columnName: name },
      }
    );
    const stopSortingMessage = i18n.translate(
      'agentTraces.docTable.tableHeader.sortByColumnUnsortedAriaLabel',
      {
        defaultMessage: 'Stop sorting on {columnName}',
        values: { columnName: name },
      }
    );

    if (currentColumnSort === undefined) {
      return sortAscendingMessage;
    } else if (currentColumnSortDirection === 'asc') {
      return sortDescendingMessage;
    } else {
      return stopSortingMessage;
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(name);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = name;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
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
    // Copy Button
    {
      active: true,
      ariaLabel: i18n.translate('agentTraces.docTable.tableHeader.copyColumnButtonAriaLabel', {
        defaultMessage: 'Copy {columnName} column name',
        values: { columnName: name },
      }),
      className: '',
      onClick: handleCopyToClipboard,
      testSubject: `docTableCopyHeader-${name}`,
      tooltip: i18n.translate('agentTraces.docTable.tableHeader.copyColumnButtonTooltip', {
        defaultMessage: 'Copy Column Name',
      }),
      iconType: 'copy',
    },
    // Remove Button
    {
      active: isRemoveable && typeof onRemoveColumn === 'function',
      ariaLabel: i18n.translate('agentTraces.docTable.tableHeader.removeColumnButtonAriaLabel', {
        defaultMessage: 'Remove {columnName} column',
        values: { columnName: name },
      }),
      className: '',
      onClick: () => onRemoveColumn && onRemoveColumn(name),
      testSubject: `docTableRemoveHeader-${name}`,
      tooltip: i18n.translate('agentTraces.docTable.tableHeader.removeColumnButtonTooltip', {
        defaultMessage: 'Remove Column',
      }),
      iconType: 'cross',
    },
  ];

  return (
    <th
      data-test-subj="docTableHeaderField"
      className="agentTracesDocTableHeaderField"
      role="columnheader"
      aria-label={i18n.translate('agentTraces.defaultTable.docTableHeaderLabel', {
        defaultMessage: 'Discover table column: {name}',
        values: { name },
      })}
    >
      <span data-test-subj={`docTableHeader-${name}`}>
        <EuiToolTip content={buildColumnTooltip(name, displayName)} position="top">
          <span className="header-text">{displayName}</span>
        </EuiToolTip>
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
                className={`agentTracesDocTableHeaderField__actionButton${
                  button.className ? ` ${button.className}` : ''
                }`}
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
