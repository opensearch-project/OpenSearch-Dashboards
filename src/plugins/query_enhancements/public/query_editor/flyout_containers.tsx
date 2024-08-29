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
  closeFlyout: () => void;
  flyoutHeader: JSX.Element;
  flyoutBody: JSX.Element;
  flyoutFooter: JSX.Element;
  ariaLabel: string;
  size?: string;
}

export const FlyoutContainers = ({
  closeFlyout,
  flyoutHeader,
  flyoutBody,
  flyoutFooter,
  ariaLabel,
  size,
}: Props) => {
  return (
    <div>
      <EuiFlyout
        className="observability-flyout"
        ownFocus={false}
        onClose={() => closeFlyout()}
        size={size ? size : 'm'}
        aria-labelledby={ariaLabel}
      >
        {flyoutHeader}
        {flyoutBody}
        {flyoutFooter}
      </EuiFlyout>
    </div>
  );
};
