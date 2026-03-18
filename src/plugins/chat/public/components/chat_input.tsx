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
import { ChatLayoutMode } from '../types';
import { ContextPills } from './context_pills';
import { SlashCommandMenu } from './slash_command_menu';
import { ChatContextPopover } from './chat_context_popover';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';
import {
  CHAT_FILE_ACCEPT,
  CHAT_ALLOWED_FILE_TYPES,
  CHAT_MAX_FILE_ATTACHMENTS as DEFAULT_MAX_FILE_ATTACHMENTS,
  ONE_MB,
} from '../../common';

import './chat_input.scss';

interface ChatInputProps {
  layoutMode: ChatLayoutMode;
  input: string;
  isCapturing: boolean;
  isStreaming: boolean;
  isSendingToolResult?: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCaptureScreenshot: () => void;
  onFilesSelected: (files: File[]) => void;
  fileUploadEnabled: boolean;
  maxFileUploadBytes: number;
  maxFileAttachments?: number;
  attachmentCount: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  layoutMode,
  input,
  isCapturing,
  isStreaming,
  isSendingToolResult = false,
  onInputChange,
  onSend,
  onStop,
  onKeyDown,
  onCaptureScreenshot,
  onFilesSelected,
  fileUploadEnabled,
  maxFileUploadBytes,
  maxFileAttachments = DEFAULT_MAX_FILE_ATTACHMENTS,
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

    const remaining = maxFileAttachments - attachmentCount;
    if (remaining <= 0) {
      notifications.toasts.addWarning(
        i18n.translate('chat.input.fileLimitReached', {
          defaultMessage:
            'You can attach up to {maxFiles} files. Remove a file before adding more.',
          values: { maxFiles: maxFileAttachments },
        })
      );
      e.target.value = '';
      return;
    }

    const allowedMimeTypes = Object.keys(CHAT_ALLOWED_FILE_TYPES);
    const allowedExtensions = Object.values(CHAT_ALLOWED_FILE_TYPES).flat();
    const isFileTypeAllowed = (f: File) => {
      if (f.type && allowedMimeTypes.includes(f.type)) return true;
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      return allowedExtensions.includes(ext);
    };

    const typeAllowed = files.filter(isFileTypeAllowed);
    const typeRejected = files.filter((f) => !isFileTypeAllowed(f));

    if (typeRejected.length > 0) {
      const names = typeRejected.map((f) => f.name).join(', ');
      notifications.toasts.addWarning(
        i18n.translate('chat.input.unsupportedFileType', {
          defaultMessage: 'Unsupported file type(s) skipped: {names}. Allowed types: {extensions}.',
          values: { names, extensions: allowedExtensions.join(', ') },
        })
      );
    }

    if (typeAllowed.length === 0) {
      e.target.value = '';
      return;
    }

    const nonEmpty = typeAllowed.filter((f) => f.size > 0);
    const emptyFiles = typeAllowed.filter((f) => f.size === 0);

    if (emptyFiles.length > 0) {
      const names = emptyFiles.map((f) => f.name).join(', ');
      notifications.toasts.addWarning(
        i18n.translate('chat.input.emptyFilesSkipped', {
          defaultMessage: 'Empty file(s) were skipped: {names}',
          values: { names },
        })
      );
    }

    const valid = nonEmpty.filter((f) => f.size <= maxFileUploadBytes);
    const oversized = nonEmpty.filter((f) => f.size > maxFileUploadBytes);

    if (oversized.length > 0) {
      const limitMB = (maxFileUploadBytes / ONE_MB).toFixed(1);
      const names = oversized.map((f) => f.name).join(', ');
      notifications.toasts.addWarning(
        i18n.translate('chat.input.filesExceedSizeLimit', {
          defaultMessage: 'File(s) exceed the {limitMB} MB limit and were skipped: {names}',
          values: { limitMB, names },
        })
      );
    }

    const accepted = valid.slice(0, remaining);
    if (accepted.length < valid.length) {
      notifications.toasts.addWarning(
        i18n.translate('chat.input.filesTruncatedByLimit', {
          defaultMessage:
            'Only {acceptedCount} of {validCount} file(s) were attached to stay within the {maxFiles}-file limit.',
          values: {
            acceptedCount: accepted.length,
            validCount: valid.length,
            maxFiles: maxFileAttachments,
          },
        })
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
      ...(fileUploadEnabled
        ? [
            {
              title: i18n.translate('chat.input.attachFile', { defaultMessage: 'Attach file' }),
              iconType: 'document',
              onClick: () => fileInputRef.current?.click(),
            },
          ]
        : []),
    ];
  }, [screenshotButton, onCaptureScreenshot, fileUploadEnabled]);

  return (
    <div className={`chatInput chatInput--${layoutMode}`}>
      {fileUploadEnabled && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={CHAT_FILE_ACCEPT}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          data-test-subj="chatFileInput"
        />
      )}
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
            disabled={isSendingToolResult}
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
          isDisabled={
            (!isStreaming && input.trim().length === 0) || isCapturing || isSendingToolResult
          }
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
