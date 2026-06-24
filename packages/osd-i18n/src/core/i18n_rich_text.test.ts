/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { translate } from './i18n';

describe('i18n rich text formatting', () => {
  it('should support tag functions for rich text formatting', () => {
    const result = translate('test.richText', {
      defaultMessage: '<p>This is a <a>link</a></p>',
      values: {
        a: (chunks: any) => `<a href="https://example.com">${chunks}</a>`,
      },
    });

    expect(result).toBe('<p>This is a <a href="https://example.com">link</a></p>');
  });

  it('should support multiple tag functions', () => {
    const result = translate('test.multipleTags', {
      defaultMessage: '<p>Text with <strong>bold</strong> and <em>italic</em></p>',
    });

    expect(result).toBe('<p>Text with <strong>bold</strong> and <em>italic</em></p>');
  });

  it('should support mixing tag functions with regular values', () => {
    const result = translate('test.mixed', {
      defaultMessage: '<p>Hello {name}, click <a>here</a></p>',
      values: {
        name: 'World',
        a: (chunks: any) => `<a href="/link">${chunks}</a>`,
      },
    });

    expect(result).toBe('<p>Hello World, click <a href="/link">here</a></p>');
  });

  it('should work without tag functions (backward compatibility)', () => {
    const result = translate('test.noTags', {
      defaultMessage: 'Simple message with {value}',
      values: {
        value: 'text',
      },
    });

    expect(result).toBe('Simple message with text');
  });
});
