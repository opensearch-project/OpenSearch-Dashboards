/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton } from '@elastic/eui'; // Ensure this import is correct and matches the library's documentation

interface RunQueryButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
}

export const RunQueryButton: React.FC<RunQueryButtonProps> = ({ onClick, isDisabled = false }) => {
  return (
    <EuiButton
      fill
      onClick={onClick}
      isDisabled={isDisabled}
      data-test-subj="runQueryButton"
      size="s"
    >
      Run query
    </EuiButton>
  );
};
