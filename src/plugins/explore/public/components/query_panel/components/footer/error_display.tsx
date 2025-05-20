/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiText,
  EuiPopoverTitle,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

interface ErrorDisplayProps {
  errorDetails: {
    statusCode: number;
    message: string;
  }; // Error details to display in the modal
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorDetails }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onPopoverButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  return (
    <>
      <EuiPopover
        button={
          <EuiButtonEmpty
            onClick={onPopoverButtonClick}
            style={{ color: 'red' }}
            data-test-subj="errorDisplayButton"
          >
            error
          </EuiButtonEmpty>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
      >
        <EuiPopoverTitle>Error Details</EuiPopoverTitle>
        <EuiFlexGroup direction="column" gutterSize="s" style={{ width: '300px' }}>
          <EuiFlexItem>
            <strong>Status Code:</strong> <EuiText size="s"> {errorDetails.statusCode}</EuiText>
          </EuiFlexItem>

          <EuiFlexItem>
            <strong>Message:</strong> <EuiText size="s">{errorDetails.message}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPopover>
    </>
  );
};
