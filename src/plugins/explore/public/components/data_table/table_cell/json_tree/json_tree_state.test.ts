/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEFAULT_JSON_TREE_STATE,
  collapseAllJsonTrees,
  getJsonTreeState,
  jsonTreeStateKey,
  updateJsonTreeState,
} from './json_tree_state';

beforeEach(() => collapseAllJsonTrees());

describe('getJsonTreeState / updateJsonTreeState', () => {
  it('reads the shared default for an untouched tree and creates an entry on the first change', () => {
    expect(getJsonTreeState('a')).toBe(DEFAULT_JSON_TREE_STATE);
    updateJsonTreeState('a', (s) => s.collapsed.set('user', false));
    expect(getJsonTreeState('a')).not.toBe(DEFAULT_JSON_TREE_STATE);
    expect(getJsonTreeState('a').collapsed.get('user')).toBe(false);
    expect(DEFAULT_JSON_TREE_STATE.collapsed.size).toBe(0);
    expect(getJsonTreeState('b')).toBe(DEFAULT_JSON_TREE_STATE);
  });

  it('stores node ids named like Object.prototype members as plain keys', () => {
    expect(getJsonTreeState('a').collapsed.get('constructor')).toBeUndefined();
    expect(getJsonTreeState('a').shown.get('toString')).toBeUndefined();
    updateJsonTreeState('a', (s) => s.shown.set('constructor', 100));
    expect(getJsonTreeState('a').shown.get('constructor')).toBe(100);
  });
});

describe('jsonTreeStateKey', () => {
  const hit = { _index: 'logs', _id: '0:0' };

  it('differs for different values under the same document id', () => {
    // e.g. row 0 of two different streaming PPL queries on the same index
    expect(jsonTreeStateKey('cell', hit, 'payload', '{"a":1}')).not.toBe(
      jsonTreeStateKey('cell', hit, 'payload', '{"a":2}')
    );
  });

  it('is the same for the same document and value, and differs per scope and field', () => {
    const key = jsonTreeStateKey('cell', hit, 'payload', '{"a":1}');
    expect(jsonTreeStateKey('cell', { ...hit }, 'payload', '{"a":1}')).toBe(key);
    expect(jsonTreeStateKey('doc', hit, 'payload', '{"a":1}')).not.toBe(key);
    expect(jsonTreeStateKey('cell', hit, 'body', '{"a":1}')).not.toBe(key);
  });

  it('is undefined without a document id', () => {
    expect(jsonTreeStateKey('cell', { _index: 'logs' }, 'payload', '{}')).toBeUndefined();
    expect(jsonTreeStateKey('cell', undefined, 'payload', '{}')).toBeUndefined();
  });
});
