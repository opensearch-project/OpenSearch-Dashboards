/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType } from 'react';
import { ComponentsMap, Message } from '../../../../common/types';
import {
  AssistantMessage as DefaultAssistantMessage,
  AssistantMessageProps,
} from '../assistant-message';
import { ImageRenderer as DefaultImageRenderer, ImageRendererProps } from '../image-renderer';
import { UserMessage as DefaultUserMessage, UserMessageProps } from '../user-message';

export interface RenderMessageProps {
  message: Message;
  inProgress: boolean;
  index: number;
  isCurrentMessage: boolean;
  actionResult?: string;
  AssistantMessage?: ComponentType<AssistantMessageProps>;
  UserMessage?: ComponentType<UserMessageProps>;
  ImageRenderer?: ComponentType<ImageRendererProps>;

  /**
   * Callback function to regenerate the assistant's response
   */
  onRegenerate?: (messageId: string) => void;

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
}

export const RenderMessage = ({
  UserMessage = DefaultUserMessage,
  AssistantMessage = DefaultAssistantMessage,
  ImageRenderer = DefaultImageRenderer,
  message,
  inProgress,
  index,
  isCurrentMessage,
  onRegenerate,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  markdownTagRenderers,
}: RenderMessageProps) => {
  switch (message.role) {
    case 'user':
      return (
        <UserMessage
          key={index}
          data-message-role="user"
          message={message}
          ImageRenderer={ImageRenderer}
        />
      );
    case 'assistant':
      return (
        <AssistantMessage
          key={index}
          data-message-role="assistant"
          message={message}
          isLoading={inProgress && isCurrentMessage && !message.content}
          isGenerating={inProgress && isCurrentMessage && !!message.content}
          isCurrentMessage={isCurrentMessage}
          onRegenerate={() => onRegenerate?.(message.id)}
          onCopy={onCopy}
          onThumbsUp={onThumbsUp}
          onThumbsDown={onThumbsDown}
          markdownTagRenderers={markdownTagRenderers}
          ImageRenderer={ImageRenderer}
        />
      );
  }
};
