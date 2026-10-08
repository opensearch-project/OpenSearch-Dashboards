/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import {
  clearModelFixes,
  getModelFix,
  markerFixKey,
  MarkerFix,
  setModelFixes,
} from '../fix_registry';

const modelA = {
  uri: monaco.Uri.parse('inmemory://model/a.ppl'),
} as unknown as monaco.editor.ITextModel;
const modelB = {
  uri: monaco.Uri.parse('inmemory://model/b.ppl'),
} as unknown as monaco.editor.ITextModel;

function makeFixes(entries: Array<[string, MarkerFix]>): Map<string, MarkerFix> {
  return new Map(entries);
}

describe('fix_registry', () => {
  afterEach(() => {
    clearModelFixes(modelA);
    clearModelFixes(modelB);
  });

  describe('markerFixKey', () => {
    it('is stable for equal position + message', () => {
      const parts = {
        startLineNumber: 1,
        startColumn: 5,
        endLineNumber: 1,
        endColumn: 10,
        message: 'msg',
      };
      expect(markerFixKey(parts)).toBe(markerFixKey({ ...parts }));
    });

    it('differs when any position field or the message differs', () => {
      const base = {
        startLineNumber: 1,
        startColumn: 5,
        endLineNumber: 1,
        endColumn: 10,
        message: 'msg',
      };
      const key = markerFixKey(base);
      expect(markerFixKey({ ...base, startColumn: 6 })).not.toBe(key);
      expect(markerFixKey({ ...base, endColumn: 11 })).not.toBe(key);
      expect(markerFixKey({ ...base, startLineNumber: 2, endLineNumber: 2 })).not.toBe(key);
      expect(markerFixKey({ ...base, message: 'other' })).not.toBe(key);
    });

    it('differs by rule id so same-position, same-message rules do not collide', () => {
      const base = {
        startLineNumber: 1,
        startColumn: 5,
        endLineNumber: 1,
        endColumn: 10,
        message: 'msg',
      };
      // A string code and a doc-link code (`{ value, target }`) both fold their
      // rule id into the key, so two rules on the same span stay distinct.
      const stringCodeKey = markerFixKey({ ...base, code: 'rule-a' });
      const linkCodeKey = markerFixKey({ ...base, code: { value: 'rule-b' } });
      expect(stringCodeKey).not.toBe(linkCodeKey);
      expect(stringCodeKey).not.toBe(markerFixKey(base));
      // Same rule id via either shape yields the same key contribution.
      expect(markerFixKey({ ...base, code: 'rule-a' })).toBe(
        markerFixKey({ ...base, code: { value: 'rule-a' } })
      );
    });
  });

  it('stores and retrieves a fix by key', () => {
    setModelFixes(modelA, makeFixes([['k1', { title: 'T', text: 'x' }]]));
    expect(getModelFix(modelA, 'k1')).toEqual({ title: 'T', text: 'x' });
    expect(getModelFix(modelA, 'missing')).toBeUndefined();
  });

  it('keeps each model fix table independent', () => {
    setModelFixes(modelA, makeFixes([['k', { title: 'A', text: 'a' }]]));
    setModelFixes(modelB, makeFixes([['k', { title: 'B', text: 'b' }]]));
    expect(getModelFix(modelA, 'k')?.title).toBe('A');
    expect(getModelFix(modelB, 'k')?.title).toBe('B');
  });

  it('replaces the whole table on each set (stale fixes do not linger)', () => {
    setModelFixes(modelA, makeFixes([['old', { title: 'old', text: 'o' }]]));
    setModelFixes(modelA, makeFixes([['new', { title: 'new', text: 'n' }]]));
    expect(getModelFix(modelA, 'old')).toBeUndefined();
    expect(getModelFix(modelA, 'new')?.title).toBe('new');
  });

  it('clears the table when an empty map is set', () => {
    setModelFixes(modelA, makeFixes([['k', { title: 'T', text: 'x' }]]));
    setModelFixes(modelA, new Map());
    expect(getModelFix(modelA, 'k')).toBeUndefined();
  });

  it('clears the table on clearModelFixes', () => {
    setModelFixes(modelA, makeFixes([['k', { title: 'T', text: 'x' }]]));
    clearModelFixes(modelA);
    expect(getModelFix(modelA, 'k')).toBeUndefined();
  });
});
