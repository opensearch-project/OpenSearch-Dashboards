/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { HttpSetup } from '../../../../core/public';
import { buildPPLLintContext } from './lint_context_builder';
import { buildOverridesFromSettings } from './lint_overrides';
import { shouldUseRuntimeGrammar } from '../antlr/opensearch_ppl/ppl_grammar_cache';

jest.mock('./lint_overrides', () => ({
  buildOverridesFromSettings: jest.fn(),
}));
jest.mock('../antlr/opensearch_ppl/ppl_grammar_cache', () => ({
  shouldUseRuntimeGrammar: jest.fn(),
}));

const mockBuildOverrides = buildOverridesFromSettings as jest.Mock;
const mockShouldUseRuntimeGrammar = shouldUseRuntimeGrammar as jest.Mock;

const services = {
  uiSettings: {} as IUiSettingsClient,
  http: {} as HttpSetup,
};

const dataset = {
  id: 'dataset-1',
  dataSource: { id: 'mds-1', version: '3.8.0' },
};

describe('buildPPLLintContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldUseRuntimeGrammar.mockReturnValue(true);
    mockBuildOverrides.mockReturnValue({ 'some-rule': { enabled: false } });
  });

  it('derives dataSourceId/version from the dataset and carries http + overrides', () => {
    const ctx = buildPPLLintContext(dataset, services);
    expect(ctx.dataSourceId).toBe('mds-1');
    expect(ctx.dataSourceVersion).toBe('3.8.0');
    expect(ctx.useRuntimeGrammar).toBe(true);
    expect(ctx.http).toBe(services.http);
    expect(ctx.overrides).toEqual({ 'some-rule': { enabled: false } });
    expect(mockBuildOverrides).toHaveBeenCalledWith(services.uiSettings);
  });

  it('handles an undefined dataset (no source selected)', () => {
    const ctx = buildPPLLintContext(undefined, services);
    expect(ctx.dataSourceId).toBeUndefined();
    expect(ctx.dataSourceVersion).toBeUndefined();
  });
});
