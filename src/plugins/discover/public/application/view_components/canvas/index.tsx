/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLoadingChart, EuiPanel } from '@elastic/eui';
import { TopNav } from './top_nav';
import { ViewProps } from '../../../../../data_explorer/public';
import { DiscoverTable } from './discover_table';

// eslint-disable-next-line import/no-default-export
export default function DiscoverCanvas({ setHeaderActionMenu, history }: ViewProps) {
  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <TopNav
          opts={{
            setHeaderActionMenu,
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="s">
          <EuiPanel>
            <EuiLoadingChart />
          </EuiPanel>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem>
        <DiscoverTable history={history} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
