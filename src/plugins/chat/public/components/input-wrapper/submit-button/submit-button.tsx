/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import classnames from 'classnames';
import { EuiButtonIcon, EuiButtonIconProps } from '@elastic/eui';
import './submit-button.scss';

export interface SubmitButtonProps {
  disabled: boolean;
  onClick?: () => void;
  dataTestSubj?: string;
  className?: string;
  icon: EuiButtonIconProps['iconType'];
}

export function SubmitButton({
  disabled,
  onClick,
  dataTestSubj,
  className,
  icon,
}: SubmitButtonProps) {
  return (
    <EuiButtonIcon
      disabled={disabled}
      onClick={onClick}
      data-test-subj={dataTestSubj}
      className={classnames('chatSubmitButton', className)}
      iconType={icon}
      size="xs"
      display="fill"
    />
  );
}
