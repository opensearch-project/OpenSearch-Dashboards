/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import classNames from 'classnames';
import { EuiButton, EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import './popover_button.scss';

interface DataSourceMenuPopoverButtonProps {
  className: string;
  label?: string;
  onClick: () => void;
  isDisabled?: boolean;
}

export const DataSourceMenuPopoverButton: React.FC<DataSourceMenuPopoverButtonProps> = ({
  className,
  label,
  onClick,
  isDisabled,
}) => {
  const wrapperClassName = classNames('dataSourceMenuPopoverButton', {
    'dataSourceMenu-isDisabled': isDisabled,
  });

  return (
    <div className={wrapperClassName} data-label="Data source">
      <EuiButton
        className="dataSourceMenuPopoverButtonLabel"
        data-test-subj={`${className}Button`}
        onClick={onClick}
        aria-label={i18n.translate('dataSourcesManagement.popoverButton.ariaLabel', {
          defaultMessage: 'Data source selector',
        })}
        iconType="database"
        iconSide="left"
        size="s"
        color="text"
        isDisabled={isDisabled}
      >
        {label ? label : null}
      </EuiButton>
      {!isDisabled && <EuiIcon type="arrowDown" size="s" color="text" />}
    </div>
  );
};
