/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButton, EuiIcon, EuiPopover, EuiToolTip, IconType } from '@elastic/eui';
import './column_header.scss';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { useCopyToClipboard } from 'react-use';
import { useDispatch } from 'react-redux';
import { removeVisibleColumnName } from '../../../../application/utils/state_management/actions/columns';
import { getColumnSizeVariableName } from '../../utils/css';

export interface ExploreResultsTableColumnHeaderProps {
  displayName: string;
  fieldName: string;
  columnId: string;
  isChangeable: boolean;
  disableHoverState: boolean;
}

const removeColumnLabel = i18n.translate('explore.resultsTable.header.removeColumnLabel', {
  defaultMessage: 'Remove column',
});
const copyNameLabel = i18n.translate('explore.resultsTable.header.copyNameLabel', {
  defaultMessage: 'Copy name',
});

export const ExploreResultsTableColumnHeader = ({
  displayName,
  fieldName,
  columnId,
  isChangeable,
  disableHoverState,
}: ExploreResultsTableColumnHeaderProps) => {
  const dispatch = useDispatch();
  const [, copyToClipboard] = useCopyToClipboard();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onButtonClick = () => setIsPopoverOpen((state) => !state);
  const closePopover = () => setIsPopoverOpen(false);

  const labelEl = (
    <span
      className="exploreResultsTableColumnHeader__title"
      style={{ maxWidth: `calc((var(${getColumnSizeVariableName(columnId)}) - 30) * 1px)` }}
    >
      {displayName}
    </span>
  );

  return (
    <div
      className={classNames('exploreResultsTableColumnHeader', {
        ['exploreResultsTableColumnHeader--popoverIsOpen']: isPopoverOpen,
      })}
    >
      {disableHoverState ? (
        labelEl
      ) : (
        <EuiToolTip content={fieldName} position="top">
          {labelEl}
        </EuiToolTip>
      )}
      <EuiPopover
        button={
          <EuiIcon
            className={classNames('exploreResultsTableColumnHeader__contextButton', {
              ['exploreResultsTableColumnHeader__contextButton--hidden']: disableHoverState,
            })}
            type="boxesVertical"
            onClick={onButtonClick}
          />
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="leftUp"
        panelPaddingSize="s"
      >
        <div className="exploreResultsTableColumnHeader__popover">
          <ExploreResultsTableHeaderPopoverButton
            disabled={!isChangeable}
            iconType="cross"
            label={removeColumnLabel}
            onClick={() => dispatch(removeVisibleColumnName(columnId))}
            closePopover={closePopover}
          />
          <EuiButton
            size="s"
            iconType="arrowLeft"
            className="exploreResultsTableColumnHeader__popoverButton"
          >
            Move left
          </EuiButton>
          <EuiButton
            size="s"
            iconType="arrowRight"
            className="exploreResultsTableColumnHeader__popoverButton"
          >
            Move Right
          </EuiButton>
          <EuiButton
            size="s"
            iconType="pin"
            className="exploreResultsTableColumnHeader__popoverButton"
          >
            Pin column
          </EuiButton>
          <ExploreResultsTableHeaderPopoverButton
            iconType="copyClipboard"
            label={copyNameLabel}
            onClick={() => copyToClipboard(fieldName)}
            closePopover={closePopover}
          />
        </div>
      </EuiPopover>
    </div>
  );
};

export const ExploreResultsTableHeaderPopoverButton = ({
  iconType,
  label,
  onClick,
  disabled,
  closePopover,
}: {
  iconType: IconType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  closePopover: () => void;
}) => {
  return (
    <EuiButton
      size="s"
      iconType={iconType}
      className="exploreResultsTableColumnHeader__popoverButton"
      onClick={() => {
        onClick();
        closePopover();
      }}
      disabled={disabled}
    >
      {label}
    </EuiButton>
  );
};
