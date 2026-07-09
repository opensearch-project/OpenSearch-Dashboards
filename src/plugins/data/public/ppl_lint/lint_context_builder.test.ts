/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { HttpSetup } from '../../../../core/public';
import { buildPPLLintContext, extractFieldNames } from './lint_context_builder';
import { buildOverridesFromSettings, isCommandSuggestionEnabled } from './lint_overrides';
import {
  pplGrammarCache,
  shouldUseRuntimeGrammar,
} from '../antlr/opensearch_ppl/ppl_grammar_cache';
import { calciteSettingsCache } from './calcite_settings_cache';

jest.mock('./lint_overrides', () => ({
  buildOverridesFromSettings: jest.fn(),
  isCommandSuggestionEnabled: jest.fn(),
}));
jest.mock('../antlr/opensearch_ppl/ppl_grammar_cache', () => {
  const actual = jest.requireActual('../antlr/opensearch_ppl/ppl_grammar_cache');
  return {
    shouldUseRuntimeGrammar: jest.fn(),
    // Use the real version derivation so isCalcite assertions are meaningful.
    deriveIsCalcite: actual.deriveIsCalcite,
    pplGrammarCache: {
      getResolvedVersion: jest.fn(),
    },
  };
});
jest.mock('./calcite_settings_cache', () => ({
  calciteSettingsCache: {
    getCached: jest.fn(),
  },
}));

const mockBuildOverrides = buildOverridesFromSettings as jest.Mock;
const mockIsCommandSuggestionEnabled = isCommandSuggestionEnabled as jest.Mock;
const mockShouldUseRuntimeGrammar = shouldUseRuntimeGrammar as jest.Mock;
const mockGetResolvedVersion = pplGrammarCache.getResolvedVersion as jest.Mock;
const mockGetCachedSettings = calciteSettingsCache.getCached as jest.Mock;

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
    mockGetResolvedVersion.mockReturnValue(undefined);
    mockGetCachedSettings.mockReturnValue(undefined);
    mockIsCommandSuggestionEnabled.mockReturnValue(true);
  });

  it('derives dataSourceId/version from the dataset and carries http + overrides', () => {
    const ctx = buildPPLLintContext(dataset, {}, services);
    expect(ctx.dataSourceId).toBe('mds-1');
    expect(ctx.dataSourceVersion).toBe('3.8.0');
    expect(ctx.useRuntimeGrammar).toBe(true);
    expect(ctx.isCalcite).toBe(true);
    expect(ctx.http).toBe(services.http);
    expect(ctx.overrides).toEqual({ 'some-rule': { enabled: false } });
    expect(mockBuildOverrides).toHaveBeenCalledWith(services.uiSettings);
  });

  it('carries the command-suggestion toggle read from uiSettings', () => {
    mockIsCommandSuggestionEnabled.mockReturnValue(false);
    const ctx = buildPPLLintContext(dataset, {}, services);
    expect(ctx.commandSuggestionEnabled).toBe(false);
    expect(mockIsCommandSuggestionEnabled).toHaveBeenCalledWith(services.uiSettings);
  });

  it('marks isCalcite false for a pre-3.3.0 data source', () => {
    const oldDataset = {
      id: 'dataset-2',
      dataSource: { id: 'mds-2', version: '2.13.0' },
    };
    const ctx = buildPPLLintContext(oldDataset, {}, services);
    expect(ctx.isCalcite).toBe(false);
  });

  it('handles an undefined dataset (no source selected)', () => {
    const ctx = buildPPLLintContext(undefined, {}, services);
    expect(ctx.dataSourceId).toBeUndefined();
    expect(ctx.dataSourceVersion).toBeUndefined();
    expect(ctx.isCalcite).toBeUndefined();
  });

  it('falls back to getResolvedVersion when dataset has no version (local cluster)', () => {
    mockGetResolvedVersion.mockReturnValue('3.6.0');
    const localDataset = { id: 'dataset-local', dataSource: { id: undefined } };

    const ctx = buildPPLLintContext(localDataset, {}, services);

    expect(mockGetResolvedVersion).toHaveBeenCalledWith(undefined);
    expect(ctx.dataSourceVersion).toBe('3.6.0');
    expect(ctx.isCalcite).toBe(true);
  });

  it('uses dataset version over resolved version when both exist', () => {
    mockGetResolvedVersion.mockReturnValue('3.6.0');
    const ctx = buildPPLLintContext(dataset, {}, services);

    expect(ctx.dataSourceVersion).toBe('3.8.0');
  });

  it('injects cached calcite settings when available', () => {
    mockGetCachedSettings.mockReturnValue({ calciteEnabled: true, allJoinTypesAllowed: true });

    const ctx = buildPPLLintContext(dataset, {}, services);

    expect(ctx.settings).toEqual({ allJoinTypesAllowed: true });
    expect(mockGetCachedSettings).toHaveBeenCalledWith('mds-1');
  });

  it('leaves settings undefined when no cached settings are available', () => {
    mockGetCachedSettings.mockReturnValue(undefined);

    const ctx = buildPPLLintContext(dataset, {}, services);

    expect(ctx.settings).toBeUndefined();
  });

  it('suppresses disabled-join-type via settings.allJoinTypesAllowed', () => {
    mockGetCachedSettings.mockReturnValue({ calciteEnabled: true, allJoinTypesAllowed: true });
    const ctx = buildPPLLintContext(dataset, {}, services);

    expect(ctx.settings?.allJoinTypesAllowed).toBe(true);
  });

  it('applies cached fields when dataset id and data source id both match', () => {
    const fields = new Set(['a', 'b']);
    const ctx = buildPPLLintContext(
      dataset,
      { datasetId: 'dataset-1', dataSourceId: 'mds-1', fields },
      services
    );
    expect(ctx.fields).toBe(fields);
  });

  it('drops cached fields when dataset id matches but data source id differs', () => {
    const fields = new Set(['a', 'b']);
    const ctx = buildPPLLintContext(
      dataset,
      { datasetId: 'dataset-1', dataSourceId: 'other-mds', fields },
      services
    );
    expect(ctx.fields).toBeUndefined();
  });

  it('drops cached fields from a different dataset (self-suppress)', () => {
    const fields = new Set(['a', 'b']);
    const ctx = buildPPLLintContext(
      dataset,
      { datasetId: 'other-dataset', dataSourceId: 'mds-1', fields },
      services
    );
    expect(ctx.fields).toBeUndefined();
  });

  it('matches when both cache and dataset have no data source (local cluster)', () => {
    const localDataset = { id: 'local-1' };
    const fields = new Set(['x']);
    const ctx = buildPPLLintContext(
      localDataset,
      { datasetId: 'local-1', dataSourceId: undefined, fields },
      services
    );
    expect(ctx.fields).toBe(fields);
  });

  it('leaves fields undefined when the cache is empty', () => {
    const ctx = buildPPLLintContext(dataset, {}, services);
    expect(ctx.fields).toBeUndefined();
  });
});

describe('extractFieldNames', () => {
  it('collects non-empty field names into a set', () => {
    const ip = { fields: [{ name: 'age' }, { name: 'status' }, { name: 'age' }] };
    expect(extractFieldNames(ip)).toEqual(new Set(['age', 'status']));
  });

  it('skips fields with no name and undefined entries', () => {
    const ip = { fields: [{ name: 'age' }, { name: '' }, undefined, {}] };
    expect(extractFieldNames(ip)).toEqual(new Set(['age']));
  });

  it('returns an empty set when there are no fields', () => {
    expect(extractFieldNames({})).toEqual(new Set());
    expect(extractFieldNames({ fields: [] })).toEqual(new Set());
  });
});
