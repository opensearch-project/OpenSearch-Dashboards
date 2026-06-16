/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ErrorInfo } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiCallOut,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';

interface ChatSessionErrorBoundaryProps {
  children: React.ReactNode;
  onStartNewSession?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ChatSessionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error boundary for the chat session that catches rendering errors
 * and allows users to continue using the chat by starting a new session.
 */
export class ChatSessionErrorBoundary extends React.Component<
  ChatSessionErrorBoundaryProps,
  ChatSessionErrorBoundaryState
> {
  constructor(props: ChatSessionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ChatSessionErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // eslint-disable-next-line no-console
    console.error('Chat session error:', error, errorInfo);
  }

  handleStartNewSession = () => {
    if (this.props.onStartNewSession) {
      this.props.onStartNewSession();
    }
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error occurred';

      return (
        <EuiEmptyPrompt
          iconType="alert"
          color="danger"
          title={
            <h3>
              {i18n.translate('chat.sessionErrorBoundary.title', {
                defaultMessage: 'Something went wrong',
              })}
            </h3>
          }
          body={
            <div>
              <EuiText size="s" color="subdued">
                <p>
                  {i18n.translate('chat.sessionErrorBoundary.description', {
                    defaultMessage:
                      'An error occurred while rendering the chat session. You can try again or start a new conversation.',
                  })}
                </p>
              </EuiText>
              {errorMessage && (
                <EuiCallOut
                  title={i18n.translate('chat.sessionErrorBoundary.errorDetailsTitle', {
                    defaultMessage: 'Error details',
                  })}
                  color="danger"
                  iconType="alert"
                  size="s"
                  style={{ marginTop: '16px', textAlign: 'left' }}
                >
                  <EuiText size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                    {errorMessage}
                  </EuiText>
                </EuiCallOut>
              )}
            </div>
          }
          actions={
            <EuiFlexGroup gutterSize="s" justifyContent="center">
              <EuiFlexItem grow={false}>
                <EuiButton color="primary" fill onClick={this.handleStartNewSession}>
                  {i18n.translate('chat.sessionErrorBoundary.newSessionButton', {
                    defaultMessage: 'Start new conversation',
                  })}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
        />
      );
    }

    return this.props.children;
  }
}
