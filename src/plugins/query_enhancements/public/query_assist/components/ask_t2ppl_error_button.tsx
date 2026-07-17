/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../../../data/public';
import { AgentError, extractAgentErrorDetail } from '../utils';

interface AskT2pplErrorButtonProps {
  error: AgentError;
  question?: string;
}

/**
 * An "Ask AI for help" link for the query assist error popover, letting the user escalate a
 * failed T2PPL (text-to-PPL) generation to chat with the original question and error details.
 */
export const AskT2pplErrorButton: React.FC<AskT2pplErrorButtonProps> = ({ error, question }) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();

  const onAskAI = () => {
    const {
      error: { error: agentError },
    } = error;
    const detail = extractAgentErrorDetail(agentError.details);
    const message = `The AI query assist failed to generate a query${
      question ? ` from my question "${question}"` : ''
    }. It returned with the error "Reason: ${agentError.reason}${
      detail ? `; Details: ${detail}` : ''
    }"\n\nPlease generate a working PPL query for this question and run it on the page, then explain why the original attempt failed.`;
    services.chat?.sendMessageWithWindow(message, []).catch(() => {});
  };

  return (
    <EuiLink onClick={onAskAI} data-test-subj="queryAssistAskAIForHelp">
      {i18n.translate('queryEnhancements.queryAssist.error.askAI', {
        defaultMessage: 'Ask AI for help',
      })}
    </EuiLink>
  );
};
