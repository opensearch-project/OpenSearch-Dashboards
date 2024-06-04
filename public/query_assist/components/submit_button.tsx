import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';

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
      aria-label="submit-question"
    />
  );
};
