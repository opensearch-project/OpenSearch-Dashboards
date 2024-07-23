/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBottomBar, EuiButton, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React from 'react';

interface SaveOrCancelProps {
  onSave: () => void;
  onCancel: () => void;
}

export const SaveOrCancel = (props: SaveOrCancelProps) => {
  const { onSave, onCancel } = props;
  return (
    <EuiBottomBar affordForDisplacement={false}>
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty onClick={onCancel} color="ghost" size="s" iconType="cross">
            Discard change(s)
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={onSave} size="s" iconType="check" fill>
            Save
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiBottomBar>
  );
};
