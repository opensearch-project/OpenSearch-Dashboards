/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFieldChanges } from './get_field_changes';

describe('getFieldChanges', () => {
  const regular = {
    count: 1,
    name: 'bytes',
    type: 'number',
    scripted: false,
    searchable: true,
    aggregatable: true,
  };
  const scripted = {
    count: 0,
    script: 'doc.bytes.value',
    lang: 'painless',
    name: 'kb',
    type: 'number',
    scripted: true,
    searchable: true,
    aggregatable: true,
  };
  const changes = (saved: object[], current: object[]) =>
    getFieldChanges(JSON.stringify(saved), JSON.stringify(current));

  it('returns undefined when nothing changed', () => {
    expect(changes([regular, scripted], [regular, scripted])).toBeUndefined();
  });

  it('sends a changed popularity count', () => {
    expect(changes([regular], [{ ...regular, count: 5 }])).toEqual({
      counts: [{ name: 'bytes', count: 5 }],
    });
  });

  it('sends a changed count for a field named __proto__', () => {
    const proto = { ...regular, name: '__proto__' };
    expect(changes([proto], [{ ...proto, count: 3 }])).toEqual({
      counts: [{ name: '__proto__', count: 3 }],
    });
  });

  it('sends a new or edited scripted field', () => {
    const edited = { ...scripted, script: 'doc.bytes.value / 1024' };
    expect(changes([regular], [regular, scripted])).toEqual({ scripted: { upsert: [scripted] } });
    expect(changes([scripted], [edited])).toEqual({ scripted: { upsert: [edited] } });
  });

  it('sends the name of a removed scripted field', () => {
    expect(changes([regular, scripted], [regular])).toEqual({ scripted: { remove: ['kb'] } });
  });

  it('ignores differences in discovered fields', () => {
    const refreshed = [
      { ...regular, type: 'string' },
      { ...regular, name: 'new', count: 0 },
    ];
    expect(changes([regular], refreshed)).toBeUndefined();
  });

  it('treats a missing saved list as empty', () => {
    expect(getFieldChanges(undefined, JSON.stringify([regular, scripted]))).toEqual({
      scripted: { upsert: [scripted] },
      counts: [{ name: 'bytes', count: 1 }],
    });
  });
});
