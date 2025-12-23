/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-expect-error - React import needed for JSX but not directly used with new JSX transform
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import { NavGroupItemInMap } from '../nav_group';

export const renderNavGroupElement = (navGroup: NavGroupItemInMap) => (
  <EuiFlexGroup gutterSize="s" alignItems="center">
    {navGroup.icon && (
      <EuiFlexItem>
        <EuiIcon type={navGroup.icon} color="text" />
      </EuiFlexItem>
    )}
    <EuiFlexItem>{navGroup.title}</EuiFlexItem>
  </EuiFlexGroup>
);
