/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getNonce } from './csp';

describe('getNonce', () => {
  afterEach(() => {
    // Clean up any meta tags created during tests
    const meta = document.querySelector('meta[name="csp-nonce"]');
    if (meta) {
      meta.remove();
    }
  });

  it('returns nonce value when meta tag exists with content', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csp-nonce');
    meta.setAttribute('content', 'test-nonce-123');
    document.head.appendChild(meta);

    expect(getNonce()).toBe('test-nonce-123');
  });

  it('returns empty string when meta tag does not exist', () => {
    expect(getNonce()).toBe('');
  });

  it('returns empty string when meta tag has no content attribute', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csp-nonce');
    document.head.appendChild(meta);

    expect(getNonce()).toBe('');
  });

  it('returns empty string when meta tag content is empty', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csp-nonce');
    meta.setAttribute('content', '');
    document.head.appendChild(meta);

    expect(getNonce()).toBe('');
  });
});
