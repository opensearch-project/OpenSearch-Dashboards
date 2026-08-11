/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../../monaco';
import {
  clearModelAiFixMetadata,
  getModelAiFixMetadata,
  setModelAiFixMetadata,
} from '../ai_fix_registry';

const modelA = {} as unknown as monaco.editor.ITextModel;
const modelB = {} as unknown as monaco.editor.ITextModel;

describe('AI fix metadata registry', () => {
  afterEach(() => {
    clearModelAiFixMetadata(modelA);
    clearModelAiFixMetadata(modelB);
  });

  it('keeps eligibility isolated by model and marker key', () => {
    setModelAiFixMetadata(modelA, new Map([['safe', { eligible: true }]]));
    setModelAiFixMetadata(modelB, new Map([['safe', { eligible: false }]]));

    expect(getModelAiFixMetadata(modelA, 'safe')).toEqual({ eligible: true });
    expect(getModelAiFixMetadata(modelB, 'safe')).toEqual({ eligible: false });
    expect(getModelAiFixMetadata(modelA, 'other')).toBeUndefined();
  });

  it('replaces and clears stale metadata wholesale', () => {
    setModelAiFixMetadata(modelA, new Map([['old', { eligible: false }]]));
    setModelAiFixMetadata(
      modelA,
      new Map([['new', { eligible: true, instructions: 'exact rewrite' }]])
    );
    expect(getModelAiFixMetadata(modelA, 'old')).toBeUndefined();
    expect(getModelAiFixMetadata(modelA, 'new')).toEqual({
      eligible: true,
      instructions: 'exact rewrite',
    });

    setModelAiFixMetadata(modelA, new Map());
    expect(getModelAiFixMetadata(modelA, 'new')).toBeUndefined();
  });
});
