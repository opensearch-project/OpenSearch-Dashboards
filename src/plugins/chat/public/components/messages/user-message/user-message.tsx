/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ComponentType } from 'react';
import { UserMessage as UserMessageMessage } from '../../../../common/types';
import { ImageRendererProps } from '../image-renderer';
import '../messages.scss';
import './user-message.scss';

export interface UserMessageProps {
  message?: UserMessageMessage;
  ImageRenderer: ComponentType<ImageRendererProps>;
}

export const UserMessage = ({ message, ImageRenderer }: UserMessageProps) => {
  const isImageMessage = message && 'image' in message && message.image;

  // Image message
  if (isImageMessage) {
    const imageMessage = message;

    return (
      <div className="chatMessage chatUserMessage">
        <ImageRenderer image={imageMessage.image!} content={imageMessage.content} />
      </div>
    );
  }

  // Regular text message
  return <div className="chatMessage chatUserMessage">{message?.content}</div>;
};
