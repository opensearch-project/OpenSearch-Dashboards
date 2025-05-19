import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiHorizontalRule } from '@elastic/eui';

interface EditOrClearProps {
  className?: string;
  handleClearEditor: () => void;
  handleEditClick: () => void;
  editText: string;
  clearText: string;
}

export const EditOrClear: React.FC<EditOrClearProps> = ({
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
        className="edit_toolbar"
      >
        <EuiFlexItem grow={false}>
          <span onClick={handleEditClick}>
            <EuiIcon type="pencil" style={{ marginRight: '2px' }} />
            <span style={{ textDecorationLine: 'underline' }}>{editText}</span>
          </span>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHorizontalRule margin="xs" className="vertical-separator" style={{ margin: '0px' }} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <span onClick={handleClearEditor}>
            <EuiIcon type="crossInCircleEmpty" style={{ marginRight: '3px' }} />
            <span style={{ textDecorationLine: 'underline' }}>{clearText}</span>
          </span>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
