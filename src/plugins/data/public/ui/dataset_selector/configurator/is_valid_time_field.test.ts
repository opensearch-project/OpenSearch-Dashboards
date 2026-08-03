/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidTimeField } from './is_valid_time_field';

describe('isValidTimeField', () => {
  it('accepts a plain aggregatable date field', () => {
    expect(isValidTimeField({ name: 'startTime', type: 'date', aggregatable: true })).toBe(true);
  });

  it('accepts a date field when aggregatable is unspecified', () => {
    // Some fetchFields implementations do not populate aggregatable; treat missing as usable.
    expect(isValidTimeField({ name: 'endTime', type: 'date' })).toBe(true);
  });

  it('rejects non-date fields', () => {
    expect(isValidTimeField({ name: 'serviceName', type: 'string', aggregatable: true })).toBe(
      false
    );
    expect(isValidTimeField({ name: 'duration', type: 'number', aggregatable: true })).toBe(false);
  });

  it('rejects nested date fields such as otel events.time', () => {
    expect(
      isValidTimeField({
        name: 'events.time',
        type: 'date',
        aggregatable: false,
        subType: { nested: { path: 'events' } },
      })
    ).toBe(false);
  });

  it('rejects explicitly non-aggregatable date fields', () => {
    expect(isValidTimeField({ name: 'someDate', type: 'date', aggregatable: false })).toBe(false);
  });
});
