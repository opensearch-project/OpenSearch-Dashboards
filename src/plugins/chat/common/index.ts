/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'chat';
export const PLUGIN_NAME = 'chat';
export const CHAT_DEFAULT_AG_UI_URL = 'http://localhost:3000';

/**
 * Text-based MIME types supported for file attachments.
 * Matches the os_art AG-UI server's TEXT_MIME_TYPES — only these types
 * are decoded and inlined as text in the LLM prompt.
 */
export const CHAT_ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'text/markdown': ['.md'],
  'text/xml': ['.xml'],
  'application/json': ['.json'],
  'application/x-ndjson': ['.ndjson'],
};

/**
 * Value for the `accept` attribute on file inputs.
 * Combines MIME types and extensions so browsers can filter the file picker.
 */
export const CHAT_FILE_ACCEPT = [
  ...Object.keys(CHAT_ALLOWED_FILE_TYPES),
  ...Object.values(CHAT_ALLOWED_FILE_TYPES).flat(),
].join(',');
