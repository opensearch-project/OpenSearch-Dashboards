/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiHorizontalRule,
  EuiLink,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import React from 'react';

interface DataConnectionsDescriptionProps {
  refresh: () => void;
}

export const DataConnectionsDescription = (props: DataConnectionsDescriptionProps) => {
  const { refresh } = props;
  return (
    <div>
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <>
            <EuiTitle size="s">
              <h2>Manage data sources</h2>
            </EuiTitle>

            <EuiSpacer size="s" />
            <EuiText size="s" color="subdued">
              Manage existing data sources or{' '}
              <EuiLink href="#/new">create a new data source</EuiLink>
            </EuiText>
          </>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={refresh} iconType="refresh">
            Refresh
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule size="full" />
    </div>
  );
};
