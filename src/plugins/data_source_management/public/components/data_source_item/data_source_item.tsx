/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiBadge, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { DataSourceOption } from '../data_source_menu/types';

interface DataSourceItemProps {
  className: string;
  option: DataSourceOption[];
  defaultDataSource: string | null;
}

export const DataSourceItem = ({ className, option, defaultDataSource }: DataSourceItemProps) => {
  return (
    <EuiFlexGroup justifyContent="spaceBetween" className={`${className}OuiFlexGroup`}>
      <EuiFlexItem className={`${className}OuiFlexItem`} grow={false}>
        {option.label || ''}
      </EuiFlexItem>
      {option.id === defaultDataSource && (
        <EuiFlexItem grow={false}>
          <EuiBadge iconSide="left">Default</EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
