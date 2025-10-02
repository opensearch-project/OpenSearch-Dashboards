/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon, EuiFlexGroup, EuiFlexItem, EuiIconTip, EuiToolTip } from '@elastic/eui';
import {
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
  DataStructureCustomMeta,
} from '../../../../../../common';

// Validation functions
export const validatePrefix = (prefix: string): string => {
  if (!prefix.trim()) {
    return 'Index prefix cannot be empty';
  }

  // Check for forbidden characters: \, /, ?, ", <, >, |, and spaces
  const forbiddenChars = /[\\\/\?"<>|\s]/;
  if (forbiddenChars.test(prefix)) {
    return 'Index prefix cannot contain spaces or special characters: \\ / ? " < > |';
  }

  return '';
};

export const canAppendWildcard = (keyPressed: string): boolean => {
  // If it's not a letter, number or is something longer, reject it
  if (!keyPressed || !/[a-z0-9]/i.test(keyPressed) || keyPressed.length !== 1) {
    return false;
  }
  return true;
};

// Icon helper functions
export const getMetaIcon = (item: DataStructure) => {
  if (item.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE) {
    return (
      <EuiToolTip content={item.meta.tooltip}>
        <EuiIcon type="iInCircle" />
      </EuiToolTip>
    );
  } else {
    if (item.meta?.icon && item.meta?.tooltip) {
      return (
        <EuiToolTip content={item.meta.tooltip}>
          <EuiIcon {...item.meta.icon} />
        </EuiToolTip>
      );
    } else if (item.meta?.icon) {
      return <EuiIcon {...item.meta.icon} />;
    }
  }
  return null;
};

export const appendIcon = (item: DataStructure) => {
  const metaIcon = getMetaIcon(item);
  const additionalIcons = (item.meta as DataStructureCustomMeta)?.additionalAppendIcons?.map(
    (icon: { tooltip: string; type: string }) => {
      return (
        <EuiFlexItem grow={false} key={icon.tooltip}>
          <EuiIconTip key={icon.tooltip} content={icon.tooltip} type={icon.type} />
        </EuiFlexItem>
      );
    }
  );

  return (
    <EuiToolTip>
      <EuiFlexGroup responsive={false} gutterSize="xs" alignItems="center" wrap={true}>
        {additionalIcons}
        {metaIcon && (
          <EuiFlexItem grow={false} key="metaIcon">
            {metaIcon}
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiToolTip>
  );
};
