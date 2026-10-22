/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { hasUsableTimeField } from './has_usable_time_field';

describe('hasUsableTimeField', () => {
  it('is true when the named time field resolves', () => {
    expect(
      hasUsableTimeField({
        timeFieldName: '@timestamp',
        getTimeField: () => ({ name: '@timestamp', type: 'date' }),
      } as any)
    ).toBe(true);
  });

  it('is false when the named time field is absent from the pattern', () => {
    expect(
      hasUsableTimeField({
        timeFieldName: '@timestamp',
        getTimeField: () => undefined,
      } as any)
    ).toBe(false);
  });

  it('is false for a pattern with no time field at all', () => {
    expect(hasUsableTimeField({ getTimeField: () => undefined } as any)).toBe(false);
  });

  it('is false when there is no index pattern', () => {
    expect(hasUsableTimeField(undefined)).toBe(false);
  });
});
