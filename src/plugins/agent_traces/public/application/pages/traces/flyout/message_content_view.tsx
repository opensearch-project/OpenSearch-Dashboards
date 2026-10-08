/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonGroup,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiCopy,
  EuiMarkdownFormat,
  EuiText,
} from '@elastic/eui';
import { parseGenAiMessages, previewMessage } from '../hooks/genai_message_preview';

/** How GenAI message content is shown: rendered markdown or the raw attribute JSON. */
export type MessageViewMode = 'formatted' | 'json';

/** Markdown rendering is skipped for very large content (kept as plain text). */
const MAX_MARKDOWN_LENGTH = 20000;

const isEmpty = (value: unknown) =>
  value === null || value === undefined || value === '' || value === '—';

/** Pretty-print the raw attribute value (JSON string or structured) for the JSON view. */
export const toPrettyJson = (value: unknown): string => {
  if (isEmpty(value)) return '';
  if (typeof value !== 'string') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

export interface DisplayMessage {
  role: string | null;
  text: string;
}

/**
 * Split a GenAI message attribute into displayable messages per the semconv schema.
 * Non-conforming values become a single message with no role.
 */
export const toDisplayMessages = (value: unknown): DisplayMessage[] => {
  if (isEmpty(value)) return [];
  const messages = parseGenAiMessages(value);
  if (messages) {
    return messages
      .map((m) => ({ role: m.role, text: previewMessage(m) }))
      .filter((m) => m.text !== '');
  }
  const text = typeof value === 'string' ? value : toPrettyJson(value);
  return text ? [{ role: null, text }] : [];
};

/** Render text as markdown, falling back to plain text for very large content. */
export const MarkdownText: React.FC<{ text: string }> = ({ text }) =>
  text.length > MAX_MARKDOWN_LENGTH ? (
    <EuiText size="s" className="agtMessageContent__plain">
      {text}
    </EuiText>
  ) : (
    <EuiText size="s" className="agtMessageContent__markdown">
      <EuiMarkdownFormat>{text}</EuiMarkdownFormat>
    </EuiText>
  );

export const MessageViewModeToggle: React.FC<{
  mode: MessageViewMode;
  onChange: (mode: MessageViewMode) => void;
  idPrefix: string;
}> = ({ mode, onChange, idPrefix }) => (
  <EuiButtonGroup
    legend={i18n.translate('agentTraces.messageView.legend', {
      defaultMessage: 'Message view mode',
    })}
    buttonSize="compressed"
    options={[
      {
        id: `${idPrefix}-formatted`,
        label: i18n.translate('agentTraces.messageView.formatted', { defaultMessage: 'Formatted' }),
        'data-test-subj': 'agentTracesMessageViewFormatted',
      },
      {
        id: `${idPrefix}-json`,
        label: i18n.translate('agentTraces.messageView.json', { defaultMessage: 'JSON' }),
        'data-test-subj': 'agentTracesMessageViewJson',
      },
    ]}
    idSelected={`${idPrefix}-${mode}`}
    onChange={(id) => onChange(id.endsWith('-json') ? 'json' : 'formatted')}
  />
);

export const CopyContentButton: React.FC<{ text: string; label: string }> = ({ text, label }) =>
  text ? (
    <EuiCopy textToCopy={text}>
      {(copy) => (
        <EuiButtonIcon
          iconType="copy"
          size="xs"
          color="text"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            copy();
          }}
          aria-label={label}
          data-test-subj="agentTracesCopyMessage"
        />
      )}
    </EuiCopy>
  ) : null;

const roleLabel = (role: string | null): string | null => {
  if (!role) return null;
  return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Message attribute content in the chosen view: role-labeled markdown blocks (Formatted)
 * or the pretty-printed attribute (JSON).
 */
export const MessageContent: React.FC<{
  value: unknown;
  mode: MessageViewMode;
  /** Formatted view override (e.g. a single turn's preview text). */
  formattedText?: string;
  emptyText?: string;
}> = ({ value, mode, formattedText, emptyText }) => {
  const noData =
    emptyText ??
    i18n.translate('agentTraces.messageView.noData', {
      defaultMessage: '(no data)',
    });

  if (mode === 'json') {
    const json = toPrettyJson(value);
    return json ? (
      <EuiCodeBlock language="json" overflowHeight={300} paddingSize="s" fontSize="s">
        {json}
      </EuiCodeBlock>
    ) : (
      <EuiText size="s" color="subdued">
        {noData}
      </EuiText>
    );
  }

  if (formattedText !== undefined) {
    return formattedText ? (
      <MarkdownText text={formattedText} />
    ) : (
      <EuiText size="s" color="subdued">
        {noData}
      </EuiText>
    );
  }

  const messages = toDisplayMessages(value);
  if (messages.length === 0) {
    return (
      <EuiText size="s" color="subdued">
        {noData}
      </EuiText>
    );
  }
  return (
    <div className="agtMessageContent">
      {messages.map((m, i) => (
        <div className="agtMessageContent__message" key={i}>
          {roleLabel(m.role) && (
            <EuiText size="xs" color="subdued" className="agtMessageContent__role">
              <strong>{roleLabel(m.role)}</strong>
            </EuiText>
          )}
          <MarkdownText text={m.text} />
        </div>
      ))}
    </div>
  );
};

/** Text copied for the current view. */
export const copyTextFor = (value: unknown, mode: MessageViewMode, formattedText?: string) =>
  mode === 'json'
    ? toPrettyJson(value)
    : (formattedText ??
      toDisplayMessages(value)
        .map((m) => (m.role ? `${m.role}: ${m.text}` : m.text))
        .join('\n\n'));
