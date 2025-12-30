/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Retrieves the CSP nonce from the meta tag in the document head.
 * The nonce is used for inline styles and scripts to comply with Content Security Policy.
 *
 * @returns The nonce value as a string, or an empty string if not found
 * @public
 */
export function getNonce(): string {
  const meta = document.querySelector('meta[name="csp-nonce"]');
  return meta?.getAttribute('content') ?? '';
}
