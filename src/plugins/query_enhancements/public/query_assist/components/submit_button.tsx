/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon } from '@elastic/eui';
import React from 'react';

interface SubmitButtonProps {
  isDisabled: boolean;
}

export const QueryAssistSubmitButton: React.FC<SubmitButtonProps> = (props) => {
  return (
    <EuiButtonIcon
      iconType="returnKey"
      display="base"
      isDisabled={props.isDisabled}
      size="s"
      type="submit"
      aria-label="Submit question to query assistant"
      data-test-subj="query-assist-submit-button"
    />
  );
};
