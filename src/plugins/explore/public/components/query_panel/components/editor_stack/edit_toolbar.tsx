/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiHorizontalRule } from '@elastic/eui';

interface EditToobarProps {
  className?: string;
  handleClearEditor: () => void;
  handleEditClick: () => void;
  editText: string;
  clearText: string;
}

export const EditToobar: React.FC<EditToobarProps> = ({
  className = 'promptEditor__editOverlay',
  handleClearEditor,
  handleEditClick,
  editText,
  clearText,
}) => {
  return (
    <div className={className}>
      <EuiFlexGroup
        direction="row"
        gutterSize="s"
        justifyContent="spaceAround"
        className="editToolbar"
      >
        <EuiFlexItem grow={false}>
          <span onClick={handleEditClick}>
            <EuiIcon type="pencil" />
            <span className="editText">{editText}</span>
          </span>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHorizontalRule margin="xs" className="verticalSeparator" style={{ margin: '0px' }} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <span onClick={handleClearEditor}>
            <EuiIcon type="crossInCircleEmpty" />
            <span className="editText">{clearText}</span>
          </span>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
