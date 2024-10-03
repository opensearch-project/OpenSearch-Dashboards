/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';

interface Props {
  items: React.JSX.Element[];
}

export const PageSection = ({ items }: Props) => {
  return (
    <EuiFlexGroup direction="column" gutterSize="xs">
      <EuiFlexItem>
        <EuiTitle size="s">
          <EuiText size="xs" color="subdued">
            Pages
          </EuiText>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem>
        {items.length ? (
          <EuiListGroup flush={true} gutterSize="none">
            {items.map((item) => (
              <EuiListGroupItem label={item} size="s" />
            ))}
          </EuiListGroup>
        ) : (
          <EuiText color="subdued" size="xs">
            No results found.
          </EuiText>
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
