/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiButtonEmpty } from '@elastic/eui';

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
          <EuiButtonEmpty
            size="xs"
            className={`${className}__button`}
            onClick={onEditClick}
            aria-label={editText}
            iconType="pencil"
          >
            <span className={`${className}__text`}>{editText}</span>
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHorizontalRule margin="xs" className={`${className}__separator`} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            size="xs"
            className={`${className}__button`}
            onClick={onClearEditor}
            aria-label={clearText}
            iconType="crossInCircleEmpty"
          >
            <span className={`${className}__text`}>{clearText}</span>
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
