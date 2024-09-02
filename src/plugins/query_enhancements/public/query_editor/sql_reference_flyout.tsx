/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiComboBoxOptionOption,
  EuiCompressedComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiLink,
  EuiMarkdownFormat,
  EuiSmallButton,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import { FlyoutContainers } from './flyout_containers';
import { Group1, Group2, Group3 } from './ppl_docs/groups';
import { overview } from './ppl_docs/overview';

interface Props {
  module: string;
  onClose: () => void;
}

export const SQLReferenceFlyout = ({ module, onClose }: Props) => {
  const flyoutHeader = (
    <EuiFlyoutHeader hasBorder>
      <EuiTitle size="m">
        <h2 id="pplReferenceFlyout">OpenSearch SQL Reference Manual</h2>
      </EuiTitle>
    </EuiFlyoutHeader>
  );

  const flyoutBody = null;

  const flyoutFooter = (
    <EuiFlyoutFooter>
      <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiSmallButton onClick={onClose}>Close</EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlyoutFooter>
  );

  return (
    <FlyoutContainers
      closeFlyout={onClose}
      flyoutHeader={flyoutHeader}
      flyoutBody={flyoutBody}
      flyoutFooter={flyoutFooter}
      ariaLabel="pplReferenceFlyout"
    />
  );
};
