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

interface Props {
  displayName: ReactNode;
  isRemoveable: boolean;
  name: string;
  onRemoveColumn?: (name: string) => void;
}

export function TableHeaderColumn({ displayName, isRemoveable, name, onRemoveColumn }: Props) {
  // action buttons displayed on the right side of the column name
  const buttons = [
    // Remove Button
    {
      active: isRemoveable && typeof onRemoveColumn === 'function',
      ariaLabel: i18n.translate('explore.docTable.tableHeader.removeColumnButtonAriaLabel', {
        defaultMessage: 'Remove {columnName} column',
        values: { columnName: name },
      }),
      className: 'fa fa-remove exploreDocTableHeader__move',
      onClick: () => onRemoveColumn && onRemoveColumn(name),
      testSubject: `docTableRemoveHeader-${name}`,
      tooltip: i18n.translate('explore.docTable.tableHeader.removeColumnButtonTooltip', {
        defaultMessage: 'Remove Column',
      }),
      iconType: 'cross',
    },
  ];

  return (
    <th
      data-test-subj="docTableHeaderField"
      className="exploreDocTableHeaderField"
      role="columnheader"
      aria-label={i18n.translate('explore.defaultTable.docTableHeaderLabel', {
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
                className="exploreDocTableHeaderField__actionButton"
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
