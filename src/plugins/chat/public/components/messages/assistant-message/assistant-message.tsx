/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType, useState } from 'react';
import { EuiButtonIcon, EuiIcon } from '@elastic/eui';
import classnames from 'classnames';
import { AIMessage, ComponentsMap, ImageRendererProps, Message } from '../../../../common/types';
import { useChatContext } from '../../chat-context';
import { Markdown } from '../../markdown/markdown';
import '../messages.scss';
import './assistant-message.scss';

export interface AssistantMessageProps {
  /**
   * The message content from the assistant
   */

  message?: AIMessage;

  /**
   * Indicates if this is the last message
   */
  isCurrentMessage?: boolean;

  /**
   * Whether a response is loading, this is when the LLM is thinking of a response but hasn't finished yet.
   */
  isLoading: boolean;

  /**
   * Whether a response is generating, this is when the LLM is actively generating and streaming content.
   */
  isGenerating: boolean;

  /**
   * Callback function to regenerate the assistant's response
   */
  onRegenerate?: () => void;

  /**
   * Callback function when the message is copied
   */
  onCopy?: (message: string) => void;

  /**
   * Callback function for thumbs up feedback
   */
  onThumbsUp?: (message: Message) => void;

  /**
   * Callback function for thumbs down feedback
   */
  onThumbsDown?: (message: Message) => void;

  /**
   * A list of markdown components to render in assistant message.
   * Useful when you want to render custom elements in the message (e.g a reference tag element)
   */
  markdownTagRenderers?: ComponentsMap;

  /**
   * A custom image rendering component to use instead of the default.
   */
  ImageRenderer?: ComponentType<ImageRendererProps>;
}

export const AssistantMessage = ({
  message,
  isLoading,
  onRegenerate,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  isCurrentMessage,
  markdownTagRenderers,
}: AssistantMessageProps) => {
  const { labels } = useChatContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const content = message?.content || '';
    if (content && onCopy) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy(content);
      setTimeout(() => setCopied(false), 2000);
    } else if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) onRegenerate();
  };

  const handleThumbsUp = () => {
    if (onThumbsUp && message) onThumbsUp(message);
  };

  const handleThumbsDown = () => {
    if (onThumbsDown && message) onThumbsDown(message);
  };

  const LoadingIcon = () => <EuiIcon type="rocket" />;
  const content = message?.content || '';
  const subComponent = message?.generativeUI?.();

  return (
    <>
      {content && (
        <div className="chatMessage chatAssistantMessage">
          {content && <Markdown content={content} />}

          {content && !isLoading && (
            <div
              className={classnames('chatMessageControls', {
                chatCurrentMessage: isCurrentMessage,
              })}
            >
              <EuiButtonIcon
                className="chatMessageControlButton"
                onClick={handleRegenerate}
                aria-label={labels.regenerateResponse}
                title={labels.regenerateResponse}
                iconType="refresh"
              />
              <EuiButtonIcon
                className="chatMessageControlButton"
                onClick={handleCopy}
                aria-label={labels.copyToClipboard}
                title={labels.copyToClipboard}
                iconType={copied ? 'check' : 'copy'}
              />
              {onThumbsUp && (
                <EuiButtonIcon
                  className="chatMessageControlButton"
                  onClick={handleThumbsUp}
                  aria-label={labels.thumbsUp}
                  title={labels.thumbsUp}
                  iconType="thumbsUp"
                />
              )}
              {onThumbsDown && (
                <EuiButtonIcon
                  className="chatMessageControlButton"
                  onClick={handleThumbsDown}
                  aria-label={labels.thumbsDown}
                  title={labels.thumbsDown}
                  iconType="thumbsDown"
                />
              )}
            </div>
          )}
        </div>
      )}
      <div style={{ marginBottom: '0.5rem' }}>{subComponent}</div>
      {isLoading && <LoadingIcon />}
    </>
  );
};
