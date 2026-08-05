/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { HttpSetup } from '../../../../core/public';
import {
  buildPPLLintContext,
  extractFieldNames,
  extractFieldMetadata,
} from './lint_context_builder';
import {
  buildOverridesFromSettings,
  isCommandSuggestionEnabled,
  readExplainMode,
} from './lint_overrides';
import {
  pplGrammarCache,
  shouldUseRuntimeGrammar,
} from '../antlr/opensearch_ppl/ppl_grammar_cache';
import { calciteSettingsCache } from './calcite_settings_cache';

jest.mock('./lint_overrides', () => ({
  buildOverridesFromSettings: jest.fn(),
  isCommandSuggestionEnabled: jest.fn(),
  readExplainMode: jest.fn(),
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
const mockReadExplainMode = readExplainMode as jest.Mock;
const mockShouldUseRuntimeGrammar = shouldUseRuntimeGrammar as jest.Mock;
const mockGetResolvedVersion = pplGrammarCache.getResolvedVersion as jest.Mock;
const mockGetCachedSettings = calciteSettingsCache.getCached as jest.Mock;

const services = {
  uiSettings: {} as IUiSettingsClient,
  http: {} as HttpSetup,
};

const dataset = {
  id: 'dataset-1',
  type: 'INDEX_PATTERN',
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
    mockReadExplainMode.mockReturnValue('thorough');
  });

  it('derives dataSourceId/version from the dataset and carries http + overrides', () => {
    const ctx = buildPPLLintContext(dataset, {}, services);
    expect(ctx.dataSourceId).toBe('mds-1');
    expect(ctx.dataSourceVersion).toBe('3.8.0');
    expect(ctx.useRuntimeGrammar).toBe(true);
    // Unknown until the engine is measured; see the engine-state cases below.
    expect(ctx.isCalcite).toBeUndefined();
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

  it('carries the explain mode read from uiSettings', () => {
    mockReadExplainMode.mockReturnValue('fast');
    const ctx = buildPPLLintContext(dataset, {}, services);
    expect(ctx.explainMode).toBe('fast');
    expect(mockReadExplainMode).toHaveBeenCalledWith(services.uiSettings);
  });

  it('marks isCalcite false for a pre-3.3.0 data source', () => {
    const oldDataset = {
      id: 'dataset-2',
      dataSource: { id: 'mds-2', version: '2.13.0' },
    };
    const ctx = buildPPLLintContext(oldDataset, {}, services);
    expect(ctx.isCalcite).toBe(false);
  });

  it('marks isCalcite false for an Elasticsearch source despite a Calcite-range version', () => {
    // An Open Distro engine never runs Calcite; the engine check overrides the
    // version so the explain-backed rules do not fire /_plugins/_ppl/_explain.
    const esDataset = {
      id: 'dataset-es',
      dataSource: { id: 'mds-es', version: '7.10.2', engineType: 'Elasticsearch' },
    };
    const ctx = buildPPLLintContext(esDataset, {}, services);
    expect(ctx.isCalcite).toBe(false);
  });

  // The administratively-disabled and cluster-reports-enabled cases are covered
  // below by the `calciteMeasured` tests, which reflect the merged policy: only a
  // reading the route actually took (`calciteMeasured === true`) is trusted, and
  // an unmeasured cached value leaves isCalcite undefined until a real reading
  // arrives.

  it('passes the dataset engine type through to shouldUseRuntimeGrammar', () => {
    const esDataset = {
      id: 'dataset-es',
      dataSource: { id: 'mds-es', version: '7.10.2', engineType: 'Elasticsearch' },
    };
    buildPPLLintContext(esDataset, {}, services);
    expect(mockShouldUseRuntimeGrammar).toHaveBeenCalledWith('mds-es', '7.10.2', 'Elasticsearch');
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
    // The resolved version feeds the grammar decision; the engine stays unknown
    // until measured.
    expect(ctx.isCalcite).toBeUndefined();
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

  it('applies cached fields when dataset id, data source id, and type all match', () => {
    const fields = new Set(['a', 'b']);
    const ctx = buildPPLLintContext(
      dataset,
      { datasetId: 'dataset-1', dataSourceId: 'mds-1', datasetType: 'INDEX_PATTERN', fields },
      services
    );
    expect(ctx.fields).toBe(fields);
  });

  it('drops cached fields when dataset id matches but data source id differs', () => {
    const fields = new Set(['a', 'b']);
    const ctx = buildPPLLintContext(
      dataset,
      { datasetId: 'dataset-1', dataSourceId: 'other-mds', datasetType: 'INDEX_PATTERN', fields },
      services
    );
    expect(ctx.fields).toBeUndefined();
  });

  it('drops cached fields when the dataset type differs (id reused across types)', () => {
    const fields = new Set(['a', 'b']);
    const ctx = buildPPLLintContext(
      dataset,
      { datasetId: 'dataset-1', dataSourceId: 'mds-1', datasetType: 'INDEXES', fields },
      services
    );
    expect(ctx.fields).toBeUndefined();
  });

  it('drops cached fields from a different dataset (self-suppress)', () => {
    const fields = new Set(['a', 'b']);
    const ctx = buildPPLLintContext(
      dataset,
      { datasetId: 'other-dataset', dataSourceId: 'mds-1', datasetType: 'INDEX_PATTERN', fields },
      services
    );
    expect(ctx.fields).toBeUndefined();
  });

  it('reuses visible indices across datasets on the same data source', () => {
    const visibleIndices = ['logs-2025', 'logs-2026'];
    const ctx = buildPPLLintContext(
      dataset,
      {
        datasetId: 'other-dataset',
        dataSourceId: 'mds-1',
        datasetType: 'INDEX_PATTERN',
        visibleIndices,
      },
      services
    );
    expect(ctx.visibleIndices).toBe(visibleIndices);
  });

  it('drops visible indices cached for a different data source', () => {
    const ctx = buildPPLLintContext(
      dataset,
      {
        datasetId: 'dataset-1',
        dataSourceId: 'other-mds',
        datasetType: 'INDEX_PATTERN',
        visibleIndices: ['other-cluster-index'],
      },
      services
    );
    expect(ctx.visibleIndices).toBeUndefined();
  });

  it('reuses visible indices when both cache and dataset are local', () => {
    const visibleIndices = ['local-index'];
    const ctx = buildPPLLintContext(
      { id: 'local-2' },
      { datasetId: 'local-1', dataSourceId: undefined, visibleIndices },
      services
    );
    expect(ctx.visibleIndices).toBe(visibleIndices);
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

  it('carries typeMap and selectedSourcePattern only when provenance matches', () => {
    const fields = new Set(['age']);
    const typeMap = new Map([['age', 'integer']]);
    const ctx = buildPPLLintContext(
      dataset,
      {
        datasetId: 'dataset-1',
        dataSourceId: 'mds-1',
        datasetType: 'INDEX_PATTERN',
        selectedSourcePattern: 'logs-*',
        fields,
        typeMap,
      },
      services
    );
    expect(ctx.typeMap).toBe(typeMap);
    expect(ctx.selectedSourcePattern).toBe('logs-*');
  });

  it('drops typeMap and selectedSourcePattern when provenance fails', () => {
    const ctx = buildPPLLintContext(
      dataset,
      {
        datasetId: 'other',
        dataSourceId: 'mds-1',
        datasetType: 'INDEX_PATTERN',
        selectedSourcePattern: 'logs-*',
        typeMap: new Map([['age', 'integer']]),
      },
      services
    );
    expect(ctx.typeMap).toBeUndefined();
    expect(ctx.selectedSourcePattern).toBeUndefined();
  });

  it('carries the data source engine type from engineType then type', () => {
    const withEngine = {
      id: 'd',
      type: 'INDEX_PATTERN',
      dataSource: { id: 'mds-1', version: '3.8.0', engineType: 'OpenSearch' },
    };
    expect(buildPPLLintContext(withEngine, {}, services).engineType).toBe('OpenSearch');

    const typeOnly = {
      id: 'd',
      type: 'INDEX_PATTERN',
      dataSource: { id: 'mds-1', version: '3.8.0', type: 'data-source' },
    };
    expect(buildPPLLintContext(typeOnly, {}, services).engineType).toBe('data-source');
  });

  it('reports a measured calciteEnabled:false, overriding the version', () => {
    // A >= 3.3 cluster with Calcite administratively disabled: the version says
    // Calcite is likely, the measured settings say it is off, and the reading wins.
    mockGetCachedSettings.mockReturnValue({
      calciteEnabled: false,
      allJoinTypesAllowed: false,
      calciteMeasured: true,
    });
    expect(buildPPLLintContext(dataset, {}, services).isCalcite).toBe(false);
  });

  it('reports a measured calciteEnabled:true', () => {
    mockGetCachedSettings.mockReturnValue({
      calciteEnabled: true,
      allJoinTypesAllowed: false,
      calciteMeasured: true,
    });
    expect(buildPPLLintContext(dataset, {}, services).isCalcite).toBe(true);
  });

  it('stays unknown on a >= 3.3 cluster until the engine is measured', () => {
    // The version cannot see an admin-disabled Calcite, so it is not proof.
    mockGetCachedSettings.mockReturnValue(undefined);
    expect(buildPPLLintContext(dataset, {}, services).isCalcite).toBeUndefined();
  });

  it('stays unknown when the settings read failed open', () => {
    // The route fails open to calciteEnabled:true. Without calciteMeasured that
    // is the engine default, not a reading, so it must not enable Calcite rules.
    mockGetCachedSettings.mockReturnValue({
      calciteEnabled: true,
      allJoinTypesAllowed: false,
      calciteMeasured: false,
    });
    expect(buildPPLLintContext(dataset, {}, services).isCalcite).toBeUndefined();
  });

  it('treats a response from an older server (no calciteMeasured) as unmeasured', () => {
    mockGetCachedSettings.mockReturnValue({ calciteEnabled: true, allJoinTypesAllowed: false });
    expect(buildPPLLintContext(dataset, {}, services).isCalcite).toBeUndefined();
  });

  it('marks isCalcite false for an Open Distro engine regardless of measurement', () => {
    // Elasticsearch speaks Open Distro SQL/PPL and has no Calcite engine, so the
    // engine type is conclusive even if a settings read claims otherwise.
    mockGetCachedSettings.mockReturnValue({
      calciteEnabled: true,
      allJoinTypesAllowed: false,
      calciteMeasured: true,
    });
    const esDataset = {
      id: 'dataset-es',
      dataSource: { id: 'mds-es', version: '7.10.2', engineType: 'Elasticsearch' },
    };
    expect(buildPPLLintContext(esDataset, {}, services).isCalcite).toBe(false);
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

describe('extractFieldMetadata', () => {
  it('collects names and a name→type map from esTypes', () => {
    const ip = {
      fields: [
        { name: 'age', esTypes: ['integer'] },
        { name: 'status', esTypes: ['keyword'] },
      ],
    };
    const { fields, typeMap } = extractFieldMetadata(ip);
    expect(fields).toEqual(new Set(['age', 'status']));
    expect(typeMap.get('age')).toBe('integer');
    expect(typeMap.get('status')).toBe('keyword');
  });

  it('keeps a field in the map only when its type is unambiguous', () => {
    // Same name with two different esTypes (conflicting merged mapping): the name
    // stays in `fields` but is omitted from the type map so a type rule self-suppresses.
    const ip = {
      fields: [
        { name: 'val', esTypes: ['integer'] },
        { name: 'val', esTypes: ['keyword'] },
        { name: 'ok', esTypes: ['double'] },
        { name: 'ok', esTypes: ['double'] },
      ],
    };
    const { fields, typeMap } = extractFieldMetadata(ip);
    expect(fields).toEqual(new Set(['val', 'ok']));
    expect(typeMap.has('val')).toBe(false);
    expect(typeMap.get('ok')).toBe('double');
  });

  it('omits a field with no esType from the map but keeps it in fields', () => {
    const ip = { fields: [{ name: 'raw' }, { name: 'n', esTypes: ['long'] }] };
    const { fields, typeMap } = extractFieldMetadata(ip);
    expect(fields).toEqual(new Set(['raw', 'n']));
    expect(typeMap.has('raw')).toBe(false);
    expect(typeMap.get('n')).toBe('long');
  });
});
