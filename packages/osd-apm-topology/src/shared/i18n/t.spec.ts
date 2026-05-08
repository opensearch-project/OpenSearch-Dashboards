/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { t, TId } from './t';
import en from './lang/en.json';

const TEST_TRANSLATION = 'breadcrumbs.world';
const INVALID_TRANSLATION_KEY = 'invalid-translation-key';

describe('T translation function', () => {
  it('gives correct strings', () => {
    const result = t(TEST_TRANSLATION as TId);
    expect(result).toBe(en.breadcrumbs.world);
  });

  it('returns the id for ids with no match', () => {
    const result = t(INVALID_TRANSLATION_KEY as TId);
    expect(result).toBe(INVALID_TRANSLATION_KEY);

    // t returns the id, not an object, if only a path prefix is supplied
    const statusIconAriaLabelPath = 'breadcrumbs.world' as TId;
    const statusIconAriaLabelValue = t(statusIconAriaLabelPath);
    expect(statusIconAriaLabelValue).toBe('World');
  });

  it('t function should replace parameters', () => {
    const faults = '90';
    const result = t('healthDonut.legend.faults', { value: faults });
    expect(result).toBe(`${faults}% faults (5xx)`);
  });
});
