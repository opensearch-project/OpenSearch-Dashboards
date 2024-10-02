/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTitle, EuiPanel, EuiHorizontalRule } from '@elastic/eui';

export const WorkspaceDetailTabPanel = ({
  title,
  actions,
  children,
}: React.PropsWithChildren<{
  title?: string;
  actions?: React.ReactNode;
}>) => {
  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiTitle size="s">
            <h2>{title}</h2>
          </EuiTitle>
        </EuiFlexItem>
        {actions && <EuiFlexItem grow={false}>{actions}</EuiFlexItem>}
      </EuiFlexGroup>
      <EuiHorizontalRule margin="m" />
      {children}
    </EuiPanel>
  );
};
