/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface DataSourceMenuPopoverButtonProps {
  className: string;
  label?: string;
  onClick: () => void;
}

export const DataSourceMenuPopoverButton: React.FC<DataSourceMenuPopoverButtonProps> = ({
  className,
  label,
  onClick,
}) => {
  return (
    <>
      <EuiButtonEmpty
        className={`dataSourceComponentButtonTitle`}
        data-test-subj={`${className}Button`}
        onClick={onClick}
        aria-label={i18n.translate(`${className}.dataSourceOptionsViewAriaLabel`, {
          defaultMessage: `${className}Button`,
        })}
        iconType="database"
        iconSide="left"
        size="s"
      >
        {label ? label : null}
      </EuiButtonEmpty>
    </>
  );
};
