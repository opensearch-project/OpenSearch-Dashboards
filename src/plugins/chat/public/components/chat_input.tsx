/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo } from 'react';
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
import { CHAT_FILE_ACCEPT, CHAT_MAX_FILE_ATTACHMENTS } from '../../common';

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
  onFilesSelected: (files: File[]) => void;
  maxFileUploadBytes: number;
  attachmentCount: number;
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
  onFilesSelected,
  maxFileUploadBytes,
  attachmentCount,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    services: {
      core: { chat, notifications },
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = CHAT_MAX_FILE_ATTACHMENTS - attachmentCount;
    if (remaining <= 0) {
      notifications.toasts.addWarning(
        `You can attach up to ${CHAT_MAX_FILE_ATTACHMENTS} files. Remove a file before adding more.`
      );
      e.target.value = '';
      return;
    }

    const valid = files.filter((f) => f.size <= maxFileUploadBytes);
    const oversized = files.filter((f) => f.size > maxFileUploadBytes);

    if (oversized.length > 0) {
      const limitMB = (maxFileUploadBytes / (1024 * 1024)).toFixed(1);
      const names = oversized.map((f) => f.name).join(', ');
      notifications.toasts.addWarning(
        `File(s) exceed the ${limitMB} MB limit and were skipped: ${names}`
      );
    }

    const accepted = valid.slice(0, remaining);
    if (accepted.length < valid.length) {
      notifications.toasts.addWarning(
        `Only ${accepted.length} of ${valid.length} file(s) were attached to stay within the ${CHAT_MAX_FILE_ATTACHMENTS}-file limit.`
      );
    }

    if (accepted.length > 0) {
      onFilesSelected(accepted);
    }

    // Reset so the same file can be re-attached
    e.target.value = '';
  };

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
      {
        title: i18n.translate('chat.input.attachFile', { defaultMessage: 'Attach file' }),
        iconType: 'document',
        onClick: () => fileInputRef.current?.click(),
      },
    ];
  }, [screenshotButton, onCaptureScreenshot]);

  return (
    <div className={`chatInput chatInput--${layoutMode}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={CHAT_FILE_ACCEPT}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        data-test-subj="chatFileInput"
      />
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
          enabled={chatContextPopoverOptions.length > 0}
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
