/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiBadge } from '@elastic/eui';
import { SelectedDataSourceOption } from './data_source_multi_selectable/data_source_filter_group';

export interface DataSourceOptionItemProps {
  item: SelectedDataSourceOption;
  defaultDataSource: string | null;
}

export const DataSourceOptionItem: React.FC<DataSourceOptionItemProps> = ({
  item,
  defaultDataSource,
}) => {
  return (
    <EuiFlexGroup alignItems="center">
      <EuiFlexItem grow={1}>{item.label}</EuiFlexItem>
      {item.id === defaultDataSource && (
        <EuiFlexItem grow={false}>
          <EuiBadge iconSide="left">Default</EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
