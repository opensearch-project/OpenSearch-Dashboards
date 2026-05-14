/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt();

/**
 * Convert markdown to HTML using `markdown-it`,
 * then sanitize with DOMPurify to prevent XSS from LLM-generated content.
 */
export function markdownToHtml(markdown: string): string {
  const rawHtml = md.render(markdown);
  return DOMPurify.sanitize(rawHtml);
}
