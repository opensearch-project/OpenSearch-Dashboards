/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiHorizontalRule } from '@elastic/eui';

// TODO: Add storybook for this in next phase
interface EditToolbarProps {
  className?: string;
  onClearEditor: () => void;
  onEditClick: () => void;
  editText: string;
  clearText: string;
}

export const EditToolbar: React.FC<EditToolbarProps> = ({
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
        className={`${className}__toolbar`}
      >
        <EuiFlexItem grow={false}>
          <button
            type="button"
            className={`${className}__button`}
            onClick={onEditClick}
            aria-label={editText}
          >
            <EuiIcon type="pencil" />
            <span className={`${className}__text`}>{editText}</span>
          </button>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHorizontalRule margin="xs" className={`${className}__separator`} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <button
            type="button"
            className={`${className}__button`}
            onClick={onClearEditor}
            aria-label={clearText}
          >
            <EuiIcon type="crossInCircleEmpty" />
            <span className={`${className}__text`}>{clearText}</span>
          </button>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
