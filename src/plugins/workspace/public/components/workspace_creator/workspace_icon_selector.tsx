/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';

const icons = ['glasses', 'search', 'bell'];

export const WorkspaceIconSelector = ({
  color,
  value,
  onChange,
}: {
  color?: string;
  value?: string;
  onChange: (value: string) => void;
}) => {
  return (
    <EuiFlexGroup>
      {icons.map((item) => (
        <EuiFlexItem
          key={item}
          onClick={() => {
            onChange(item);
          }}
          grow={false}
        >
          <EuiIcon size="l" type={item} color={value === item ? color : undefined} />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};
