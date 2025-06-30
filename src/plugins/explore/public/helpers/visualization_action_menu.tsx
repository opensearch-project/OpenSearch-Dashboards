/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiListGroupItem, EuiText } from '@elastic/eui';
import React from 'react';

export const VisualizationActionMenuItem = ({
  exploreVisDisplayName,
  onClick,
}: {
  exploreVisDisplayName: string;
  onClick: () => void;
}) => {
  return (
    <EuiListGroupItem
      iconType="visualizeApp"
      onClick={onClick}
      label={
        <>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem>{exploreVisDisplayName}</EuiFlexItem>
            <EuiFlexItem>
              <EuiBadge color="hollow" iconType="sparkleFilled">
                New!
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiText size="xs" color="subdued">
            Build query-powered visualizations
          </EuiText>
        </>
      }
    />
  );
};
