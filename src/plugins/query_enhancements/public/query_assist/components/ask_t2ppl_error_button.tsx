/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { ChatServiceStart } from '../../../../../core/public';
import { AgentError, extractAgentErrorDetail } from '../utils';

interface AskT2pplErrorButtonProps {
  chatService?: ChatServiceStart;
  error: Error;
  question?: string;
  as?: 'link' | 'button';
  testSource: string;
}

/**
 * An "Ask AI for help" affordance that escalates a failed T2PPL (text-to-PPL) generation to chat
 * with the original question and error details.
 */
export const AskT2pplErrorButton: React.FC<AskT2pplErrorButtonProps> = ({
  chatService,
  error,
  question,
  as = 'link',
  testSource,
}) => {
  const onAskAI = () => {
    let reason = error.message;
    let detail = '';
    if (error instanceof AgentError) {
      const {
        error: { error: agentError },
      } = error;
      reason = agentError.reason;
      detail = extractAgentErrorDetail(agentError.details);
    }
    const message = `The AI query assist failed to generate a query${
      question ? ` from my question "${question}"` : ''
    }. It returned with the error "Reason: ${reason}${
      detail ? `; Details: ${detail}` : ''
    }"\n\nPlease generate a working PPL query for this question and run it on the page, then explain why the original attempt failed.`;
    chatService?.sendMessageWithWindow(message, []).catch(() => {});
  };

  if (as === 'button') {
    return (
      <EuiButton
        size="s"
        color="danger"
        style={{ marginLeft: 8 }}
        onClick={onAskAI}
        data-test-subj={testSource}
      >
        {i18n.translate('queryEnhancements.queryAssist.error.askAI', {
          defaultMessage: 'Ask AI for help',
        })}
      </EuiButton>
    );
  }

  return (
    <EuiLink onClick={onAskAI} data-test-subj={testSource}>
      {i18n.translate('queryEnhancements.queryAssist.error.askAI', {
        defaultMessage: 'Ask AI for help',
      })}
    </EuiLink>
  );
};
