/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALLOWED_KEYS, VALID_MODIFIER_COMBINATIONS } from './constants';

// This can be removed once Regexp.escape() is available
export const escapeKey = (key: string) => {
  return ['.', '[', ']', '/', '\\'].includes(key) ? `\\${key}` : key;
};

// This can be removed once Regexp.escape() is available
export const escapeModifier = (key: string) => {
  return key.replaceAll('+', '\\+');
};

export const VALID_KEY_STRING_REGEX = new RegExp(
  `^(?:${VALID_MODIFIER_COMBINATIONS.map((combo) => escapeModifier(combo.join(''))).join(
    '|'
  )})?(?:${ALLOWED_KEYS.map(escapeKey).join('|')})$`
);

export const SINGLE_LETTER_REGEX = /^[a-z]$/;
