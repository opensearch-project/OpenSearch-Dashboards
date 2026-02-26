/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo } from 'react';
import { EuiButtonIcon, EuiTextColor, EuiTextArea } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useCommandMenuKeyboard } from '../hooks/use_command_menu_keyboard';
import { ChatLayoutMode } from './chat_header_button';
import { ContextPills } from './context_pills';
import { SlashCommandMenu } from './slash_command_menu';
import { ChatContextPopover } from './chat_context_popover';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';

import './chat_input.scss';

interface ChatInputProps {
  layoutMode: ChatLayoutMode;
  input: string;
  isCapturing: boolean;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  includeScreenShotEnabled: boolean;
  onCaptureScreenshot: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  layoutMode,
  input,
  isCapturing,
  isStreaming,
  onInputChange,
  onSend,
  onStop,
  onKeyDown,
  includeScreenShotEnabled,
  onCaptureScreenshot,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    services: {
      core: { chat },
    },
  } = useOpenSearchDashboards<{ core: CoreStart }>();

  // Get screenshot button configuration from the screenshot service
  const screenshotButtonObservable$ = useMemo(() => {
    if (chat?.screenshot?.getScreenshotButton$) {
      return chat.screenshot.getScreenshotButton$();
    }
    return of(null);
  }, [chat]);

  const screenshotButton = useObservable(screenshotButtonObservable$, null);

  // Use custom hook for command menu keyboard handling
  const {
    showCommandMenu,
    commandSuggestions,
    selectedCommandIndex,
    ghostText,
    handleKeyDown,
    handleCommandSelect,
  } = useCommandMenuKeyboard({
    input,
    onInputChange,
    onKeyDown,
    inputRef,
  });

  const chatContextPopoverOptions = useMemo(() => {
    return [
      ...(screenshotButton
        ? [
            {
              title: screenshotButton.title,
              iconType: screenshotButton.iconType || 'image',
              onClick: onCaptureScreenshot,
            },
          ]
        : []),
    ];
  }, [screenshotButton, onCaptureScreenshot]);

  return (
    <div className={`chatInput chatInput--${layoutMode}`}>
      <div className="chatInput__inputRow" style={{ position: 'relative' }}>
        {showCommandMenu && (
          <SlashCommandMenu
            commands={commandSuggestions}
            selectedIndex={selectedCommandIndex}
            onSelect={handleCommandSelect}
          />
        )}
        <div className="chatInput__fieldWrapper">
          <EuiTextArea
            inputRef={inputRef}
            placeholder="How can I help you today?"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus={true}
            fullWidth
            resize="none"
            rows={2}
          />
          {ghostText && (
            <div className="chatInput__ghostText" aria-hidden="true">
              {input}
              <EuiTextColor color="subdued" className="chatInput__ghostText--subdued">
                {ghostText}
              </EuiTextColor>
            </div>
          )}
        </div>
      </div>
      <div className="chatInput__bottomRow">
        <ChatContextPopover
          enabled={includeScreenShotEnabled}
          options={chatContextPopoverOptions}
        />
        <ContextPills category="chat" />
        <EuiButtonIcon
          iconType={isStreaming ? 'stop' : 'sortUp'}
          onClick={isStreaming ? onStop : onSend}
          isDisabled={(!isStreaming && input.trim().length === 0) || isCapturing}
          aria-label={isStreaming ? 'Stop generating' : 'Send message'}
          size="m"
          color={isStreaming ? 'danger' : 'primary'}
          display="fill"
          className="chatInput__sendButton"
        />
      </div>
    </div>
  );
};
