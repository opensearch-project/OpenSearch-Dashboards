/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { markdownToHtml } from './markdown_converter';

describe('markdownToHtml', () => {
  it('should convert basic markdown to HTML', () => {
    const result = markdownToHtml('**bold** and *italic*');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('should convert headers', () => {
    const result = markdownToHtml('# Heading 1\n## Heading 2');
    expect(result).toContain('<h1>Heading 1</h1>');
    expect(result).toContain('<h2>Heading 2</h2>');
  });

  it('should convert code blocks', () => {
    const result = markdownToHtml('```\nconst x = 1;\n```');
    expect(result).toContain('<code>');
    expect(result).toContain('const x = 1;');
  });

  it('should convert inline code', () => {
    const result = markdownToHtml('Use `console.log()` for debugging');
    expect(result).toContain('<code>console.log()</code>');
  });

  it('should convert unordered lists', () => {
    const result = markdownToHtml('- item 1\n- item 2');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>item 1</li>');
    expect(result).toContain('<li>item 2</li>');
  });

  it('should convert links', () => {
    const result = markdownToHtml('[OpenSearch](https://opensearch.org)');
    expect(result).toContain('<a href="https://opensearch.org">OpenSearch</a>');
  });

  it('should convert tables', () => {
    const result = markdownToHtml('| A | B |\n|---|---|\n| 1 | 2 |');
    expect(result).toContain('<table>');
    expect(result).toContain('<th>');
    expect(result).toContain('<td>');
  });

  it('should sanitize dangerous HTML', () => {
    const result = markdownToHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });

  it('should sanitize javascript URLs', () => {
    const result = markdownToHtml('[click](javascript:alert(1))');
    // Either the link is not rendered as <a>, or if it is, the href is sanitized
    expect(result).not.toContain('href="javascript:');
  });

  it('should handle empty input', () => {
    const result = markdownToHtml('');
    expect(result).toBe('');
  });
});
