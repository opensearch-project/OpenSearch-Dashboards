/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'chat';
export const PLUGIN_NAME = 'chat';
export const CHAT_DEFAULT_AG_UI_URL = 'http://localhost:3000';

export const ONE_MB = 1024 * 1024;

/** Maximum number of file attachments per message. */
export const CHAT_MAX_FILE_ATTACHMENTS = 10;

/**
 * MIME types supported for file attachments.
 * - Text types: decoded and inlined as text in the LLM prompt.
 * - image/jpeg: used by the screenshot capture (html2canvas → canvas.toDataURL).
 *   Required for server validation; screenshots would be rejected without it.
 */
export const CHAT_ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'text/markdown': ['.md'],
  'text/xml': ['.xml'],
  'application/json': ['.json'],
  'application/x-ndjson': ['.ndjson'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

/**
 * Value for the `accept` attribute on file inputs.
 * Combines MIME types and extensions so browsers can filter the file picker.
 */
export const CHAT_FILE_ACCEPT = [
  ...Object.keys(CHAT_ALLOWED_FILE_TYPES),
  ...Object.values(CHAT_ALLOWED_FILE_TYPES).flat(),
].join(',');
