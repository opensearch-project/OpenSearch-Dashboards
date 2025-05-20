/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPopover, EuiButtonEmpty, EuiText, EuiPopoverTitle } from '@elastic/eui';

interface ErrorDisplayProps {
  errorDetails: string; // Error details to display in the modal
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorDetails }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onPopoverButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  return (
    <>
      {/* Error Text with Popover */}
      <EuiPopover
        button={
          <EuiButtonEmpty
            iconType="alert"
            onClick={onPopoverButtonClick}
            style={{ color: 'red', fontWeight: '' }}
            data-test-subj="errorDisplayButton"
          >
            err
          </EuiButtonEmpty>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
      >
        <EuiPopoverTitle>Error Details</EuiPopoverTitle>
        <EuiText size="s" style={{ padding: '10px', maxWidth: '300px' }}>
          <p>PPL Compilation Error: Unknown field [timestam]. Did you mean [timestamp]?</p>
        </EuiText>
      </EuiPopover>
    </>
  );
};
