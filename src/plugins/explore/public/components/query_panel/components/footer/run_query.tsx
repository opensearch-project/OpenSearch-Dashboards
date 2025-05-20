/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton } from '@elastic/eui'; // Ensure this import is correct and matches the library's documentation

interface RunQueryButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
}

export const RunQueryButton: React.FC<RunQueryButtonProps> = ({
  onClick,
  isDisabled = false,
  isLoading,
}) => {
  return (
    <EuiButton
      fill
      onClick={onClick}
      isDisabled={isDisabled}
      data-test-subj="runQueryButton"
      size="s"
      isLoading={isLoading}
    >
      Run query
    </EuiButton>
  );
};
