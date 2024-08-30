/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout } from '@elastic/eui';
import React from 'react';

/*
 * "FlyoutContainers" component used to create flyouts
 *
 * Props taken in as params are:
 * flyoutHeader - header JSX element of flyout
 * flyoutBody - body JSX element of flyout
 * flyoutFooter - footer JSX element of flyout
 * ariaLabel - aria-label for focus of flyout
 */

interface Props {
  onClose: () => void;
  header: JSX.Element;
  body: JSX.Element | null;
  footer: JSX.Element;
  ariaLabel: string;
  size?: string;
}

export const ReferenceFlyoutContainer = ({
  onClose,
  header,
  body,
  footer,
  ariaLabel,
  size,
}: Props) => {
  return (
    <div>
      <EuiFlyout
        className="observability-flyout"
        ownFocus={false}
        onClose={onClose}
        size={size ? size : 'm'}
        aria-labelledby={ariaLabel}
      >
        {header}
        {body}
        {footer}
      </EuiFlyout>
    </div>
  );
};
