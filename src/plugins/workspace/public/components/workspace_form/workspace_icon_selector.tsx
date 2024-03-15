/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiSuperSelect, EuiText } from '@elastic/eui';

const icons = ['Glasses', 'Search', 'Bell', 'Package'];

export const WorkspaceIconSelector = ({
  color,
  value,
  onChange,
}: {
  color?: string;
  value?: string;
  onChange: (value: string) => void;
}) => {
  const options = icons.map((item) => ({
    value: item,
    inputDisplay: (
      <EuiFlexGroup
        gutterSize="s"
        alignItems="center"
        data-test-subj={`workspaceForm-workspaceDetails-iconSelector-${item}`}
      >
        <EuiFlexItem grow={false}>
          <EuiIcon type={item.toLowerCase()} color={color} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText color={'subdued'}>{item}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  }));
  return (
    <EuiSuperSelect
      data-test-subj="workspaceForm-workspaceDetails-iconSelector"
      options={options}
      valueOfSelected={value}
      onChange={(icon) => onChange(icon)}
    />
  );
};
