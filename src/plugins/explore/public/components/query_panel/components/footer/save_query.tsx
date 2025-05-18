/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { EuiPopover, EuiButtonEmpty, EuiText, EuiIcon } from '@elastic/eui';

export const SaveQueryButton: React.FC = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          onClick={onButtonClick}
          iconType="save" // Add the folderOpen icon
          style={{ color: '#0073e6', padding: '0px' }} // Highlighted text style
          data-test-subj="saveQueryButton"
        >
          Saved Queries
          <EuiIcon type="arrowDown" style={{ marginLeft: '5px' }} /> {/* Add arrowDown icon */}
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downCenter"
    >
      <div style={{ padding: '10px' }} data-test-subj="saveQueryPopover">
        <EuiText size="s">
          <p>Save your query for future use.</p>
        </EuiText>
      </div>
    </EuiPopover>
  );
};
