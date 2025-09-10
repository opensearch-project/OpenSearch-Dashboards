/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import classnames from 'classnames';
import { EuiButton, EuiLoadingSpinner } from '@elastic/eui';
import { useAIChat } from '../../../hooks';
import './suggestion.scss';

export interface SuggestionProps {
  title: string;
  message: string;
  partial?: boolean;
  className?: string;
  onClick: () => void;
}

const loadingClassName = 'chatSuggestion__loading';

export const Suggestion = ({ title, onClick, partial, className }: SuggestionProps) => {
  const { isLoading } = useAIChat();
  if (!title) return null;

  return (
    <EuiButton
      disabled={partial || isLoading}
      onClick={onClick}
      className={classnames('chatSuggestion', className, { [loadingClassName]: partial })}
      data-test-subj="chatSuggestion"
    >
      {partial ? <EuiLoadingSpinner /> : <span>{title}</span>}
    </EuiButton>
  );
};
