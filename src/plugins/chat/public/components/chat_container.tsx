/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-expect-error TS2305 TODO(ts-error): fixme
import { ChatLayoutMode } from './chat_header_button';
import './chat_container.scss';

interface ChatContainerProps {
  layoutMode: ChatLayoutMode;
  children: React.ReactNode;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ layoutMode, children }) => {
  return <div className={`chatContainer chatContainer--${layoutMode}`}>{children}</div>;
};
