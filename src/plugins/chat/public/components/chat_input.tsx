/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFieldText, EuiButtonIcon, EuiImage, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import { ContextPills } from './context_pills';
import './chat_input.scss';

interface ChatInputProps {
  layoutMode: ChatLayoutMode;
  input: string;
  isStreaming: boolean;
  pendingImage?: string; // Base64 image data
  isCapturingImage?: boolean; // New prop for screenshot loading state
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onRemoveImage?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  layoutMode,
  input,
  isStreaming,
  pendingImage,
  isCapturingImage,
  onInputChange,
  onSend,
  onKeyDown,
  onRemoveImage,
}) => {
  return (
    <div className={`chatInput chatInput--${layoutMode}`}>
      <ContextPills category="chat" />

      <div className="chatInput__inputContainer">
        {/* Loading indicator for screenshot capture */}
        {isCapturingImage && (
          <div className="chatInput__loadingIndicator">
            <EuiLoadingSpinner size="s" data-test-subj="euiLoadingSpinner" />
            <EuiText size="xs" color="subdued">
              Capturing screenshot...
            </EuiText>
          </div>
        )}

        {/* Image preview integrated into input */}
        {pendingImage && (
          <div className="chatInput__imageAttachment">
            <EuiImage
              src={pendingImage}
              alt="Visualization screenshot"
              size="s"
              hasShadow
              allowFullScreen
            />
            {onRemoveImage && (
              <EuiButtonIcon
                className="chatInput__removeButton"
                iconType="cross"
                onClick={onRemoveImage}
                aria-label="Remove image"
                size="xs"
              />
            )}
          </div>
        )}

        <div className="chatInput__inputRow">
          <EuiFieldText
            placeholder={
              pendingImage ? 'Ask a question about the visualization...' : 'Type your message...'
            }
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isStreaming}
            fullWidth
            className={pendingImage ? 'chatInput__fieldWithImage' : ''}
          />
          <EuiButtonIcon
            iconType={isStreaming ? 'generate' : 'sortUp'}
            onClick={onSend}
            isDisabled={(input.trim().length === 0 && !pendingImage) || isStreaming}
            aria-label="Send message"
            size="m"
            color="primary"
            display="fill"
          />
        </div>
      </div>
    </div>
  );
};
