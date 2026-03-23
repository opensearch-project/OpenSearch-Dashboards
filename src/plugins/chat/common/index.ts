/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'chat';
export const PLUGIN_NAME = 'chat';
export const CHAT_DEFAULT_AG_UI_URL = 'http://localhost:3000';

export const ONE_MB = 1024 * 1024;

/** Default maximum file upload size in bytes (3 MB). */
export const CHAT_DEFAULT_MAX_FILE_UPLOAD_BYTES = 3 * ONE_MB;

/** Maximum number of file attachments per message. */
export const CHAT_MAX_FILE_ATTACHMENTS = 10;

/**
 * MIME types supported for file attachments.
 * - Text types: decoded and inlined as text in the LLM prompt.
 * - image/jpeg: used by the screenshot capture (html2canvas → canvas.toDataURL).
 *   Required for server validation; screenshots would be rejected without it.
 * - text/xml excluded: XML can trigger XXE if the AG-UI backend parses it unsafely.
 */
export const CHAT_ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'text/markdown': ['.md'],
  'application/json': ['.json'],
  'application/x-ndjson': ['.ndjson'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

/**
 * MIME type produced by the screenshot capture (html2canvas → canvas.toDataURL).
 * Used by server-side validation to identify screenshot content when file uploads
 * are disabled: only binary parts without a filename AND this MIME type are allowed.
 */
export const CHAT_SCREENSHOT_MIME_TYPE = 'image/jpeg';

/** Maximum number of screenshots per message (one page capture). */
export const CHAT_MAX_SCREENSHOTS_PER_MESSAGE = 1;

/**
 * Value for the `accept` attribute on file inputs.
 * Combines MIME types and extensions so browsers can filter the file picker.
 */
export const CHAT_FILE_ACCEPT = [
  ...Object.keys(CHAT_ALLOWED_FILE_TYPES),
  ...Object.values(CHAT_ALLOWED_FILE_TYPES).flat(),
].join(',');
