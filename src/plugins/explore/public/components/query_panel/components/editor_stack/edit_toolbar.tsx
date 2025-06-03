/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiHorizontalRule } from '@elastic/eui';

interface EditToobarProps {
  className?: string;
  onClearEditor: () => void;
  onEditClick: () => void;
  editText: string;
  clearText: string;
}

export const EditToobar: React.FC<EditToobarProps> = ({
  className = 'promptEditor__editOverlay',
  onClearEditor,
  onEditClick,
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
          <button
            type="button"
            className="editToolbar__button"
            onClick={onEditClick}
            aria-label={editText}
          >
            <EuiIcon type="pencil" />
            <span className="editText">{editText}</span>
          </button>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHorizontalRule margin="xs" className="verticalSeparator" style={{ margin: '0px' }} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <button
            type="button"
            className="editToolbar__button"
            onClick={onClearEditor}
            aria-label={clearText}
          >
            <EuiIcon type="crossInCircleEmpty" />
            <span className="editText">{clearText}</span>
          </button>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
