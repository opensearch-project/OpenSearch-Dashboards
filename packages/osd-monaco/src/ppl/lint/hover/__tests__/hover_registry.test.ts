/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../../monaco';
import {
  clearModelHoverFacts,
  getModelHoverFacts,
  HoverFacts,
  setModelHoverFacts,
} from '../hover_registry';

const modelA = {
  uri: monaco.Uri.parse('inmemory://model/a.ppl'),
} as unknown as monaco.editor.ITextModel;
const modelB = {
  uri: monaco.Uri.parse('inmemory://model/b.ppl'),
} as unknown as monaco.editor.ITextModel;

function facts(entries: Array<[string, HoverFacts]>): Map<string, HoverFacts> {
  return new Map(entries);
}

describe('hover_registry', () => {
  afterEach(() => {
    clearModelHoverFacts(modelA);
    clearModelHoverFacts(modelB);
  });

  it('stores and retrieves facts by key', () => {
    setModelHoverFacts(modelA, facts([['k1', { field: 'age', esType: 'integer' }]]));
    expect(getModelHoverFacts(modelA, 'k1')).toEqual({ field: 'age', esType: 'integer' });
    expect(getModelHoverFacts(modelA, 'missing')).toBeUndefined();
  });

  it('keeps each model table independent', () => {
    setModelHoverFacts(modelA, facts([['k', { field: 'a' }]]));
    setModelHoverFacts(modelB, facts([['k', { field: 'b' }]]));
    expect(getModelHoverFacts(modelA, 'k')?.field).toBe('a');
    expect(getModelHoverFacts(modelB, 'k')?.field).toBe('b');
  });

  it('replaces the whole table on each set (stale facts do not linger)', () => {
    setModelHoverFacts(modelA, facts([['old', { field: 'old' }]]));
    setModelHoverFacts(modelA, facts([['new', { field: 'new' }]]));
    expect(getModelHoverFacts(modelA, 'old')).toBeUndefined();
    expect(getModelHoverFacts(modelA, 'new')?.field).toBe('new');
  });

  it('clears the table when an empty map is set', () => {
    setModelHoverFacts(modelA, facts([['k', { field: 'x' }]]));
    setModelHoverFacts(modelA, new Map());
    expect(getModelHoverFacts(modelA, 'k')).toBeUndefined();
  });

  it('clears the table on clearModelHoverFacts', () => {
    setModelHoverFacts(modelA, facts([['k', { field: 'x' }]]));
    clearModelHoverFacts(modelA);
    expect(getModelHoverFacts(modelA, 'k')).toBeUndefined();
  });
});
