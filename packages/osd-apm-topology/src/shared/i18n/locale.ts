/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_LOCALE = 'en';

export const getLocale = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { i18n } = require('@osd/i18n');
    return i18n.getLocale() || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};
