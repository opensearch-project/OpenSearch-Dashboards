/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Dataset } from '../../../../../data/common';
import type { SourceTypeLogsDrilldownScope } from '../../../services/source_type_registry';
import { OPENSEARCH_SOURCE_TYPE_ID } from '../../../services/source_type_registry';
import { stableKey } from './stable_key';
import { DrilldownAppState, SourceBatchAction } from './types';

/**
 * The Explore logs page's own state: which source and scope it shows, the OpenSearch data source,
 * the search, and the toolbar's batch action. The page keeps the persisted part (source, scope,
 * data source) in its URL (`_a`) and the tab's session with one effect; everything that changes it
 * goes through `drilldownPageReducer`.
 */
export interface DrilldownPageState {
  sourceTypeId: string;
  /** A registered source's scope; undefined until its picker reports one (and for OpenSearch). */
  scope?: SourceTypeLogsDrilldownScope;
  dataSource?: Dataset['dataSource'];
  /**
   * The data source picker has confirmed `dataSource` (only meaningful with MDS on). A data source
   * from the URL isn't trusted until then: the picker validates it, then reports it.
   */
  dataSourceResolved: boolean;
  /** Bumped when the URL names another data source: the picker remounts on it to validate it. */
  dataSourcePickerKey: number;
  searchInput: string;
  /** The debounced search the lists use. */
  search: string;
  batchAction: SourceBatchAction | null;
}

export type DrilldownPageAction =
  | { type: 'selectSource'; sourceTypeId: string }
  | { type: 'setScope'; scope: SourceTypeLogsDrilldownScope }
  | { type: 'setDataSource'; dataSource?: Dataset['dataSource'] }
  | { type: 'setSearchInput'; value: string }
  | { type: 'commitSearch' }
  | { type: 'setBatchAction'; action: SourceBatchAction | null }
  /** `_a` changed outside the page (a hand-edited URL, back/forward). */
  | { type: 'applyExternalAppState'; appState: DrilldownAppState; knownSourceTypeIds: string[] };

/** Switches to another source: its scope comes from its picker, and the search is per source. */
const withSource = (
  state: DrilldownPageState,
  sourceTypeId: string,
  scope?: SourceTypeLogsDrilldownScope
): DrilldownPageState => ({
  ...state,
  sourceTypeId,
  scope: sourceTypeId === OPENSEARCH_SOURCE_TYPE_ID ? undefined : scope,
  searchInput: '',
  search: '',
  batchAction: null,
});

export const drilldownPageReducer = (
  state: DrilldownPageState,
  action: DrilldownPageAction
): DrilldownPageState => {
  switch (action.type) {
    case 'selectSource':
      return action.sourceTypeId === state.sourceTypeId
        ? state
        : withSource(state, action.sourceTypeId);
    case 'setScope':
      return stableKey(action.scope) === stableKey(state.scope)
        ? state
        : { ...state, scope: action.scope, batchAction: null };
    case 'setDataSource':
      // From the picker: an id means it resolved a real data source. No id is an empty selection
      // (with MDS on, a workspace with none), which must not fall back to the local cluster.
      return {
        ...state,
        dataSource: action.dataSource?.id ? action.dataSource : undefined,
        dataSourceResolved: !!action.dataSource?.id,
      };
    case 'setSearchInput':
      return { ...state, searchInput: action.value };
    case 'commitSearch':
      return state.search === state.searchInput ? state : { ...state, search: state.searchInput };
    case 'setBatchAction':
      return { ...state, batchAction: action.action };
    case 'applyExternalAppState': {
      const { appState, knownSourceTypeIds } = action;
      let next = state;
      const wanted = appState.sourceType ?? OPENSEARCH_SOURCE_TYPE_ID;
      const known = wanted === OPENSEARCH_SOURCE_TYPE_ID || knownSourceTypeIds.includes(wanted);
      if (known && wanted !== state.sourceTypeId) {
        next = withSource(next, wanted, appState.scope);
      } else if (
        known &&
        wanted !== OPENSEARCH_SOURCE_TYPE_ID &&
        stableKey(appState.scope ?? null) !== stableKey(state.scope ?? null)
      ) {
        next = { ...next, scope: appState.scope, batchAction: null };
      }
      const urlDataSourceId = appState.dataSource?.id;
      if (urlDataSourceId && urlDataSourceId !== state.dataSource?.id) {
        // Not resolved yet: the remounted picker validates the id and reports what it resolves.
        next = {
          ...next,
          dataSource: appState.dataSource,
          dataSourceResolved: false,
          dataSourcePickerKey: state.dataSourcePickerKey + 1,
        };
      }
      return next;
    }
    default:
      return state;
  }
};

/** The `_a` the page writes for its state, merged into what's there (other keys are kept). */
export const appStateFor = (
  state: Pick<DrilldownPageState, 'sourceTypeId' | 'scope' | 'dataSource'>,
  current: DrilldownAppState | null | undefined
): DrilldownAppState => {
  const next: Record<string, unknown> = {
    ...(current ?? {}),
    dataSource: state.dataSource,
    sourceType: state.sourceTypeId === OPENSEARCH_SOURCE_TYPE_ID ? undefined : state.sourceTypeId,
    scope: state.sourceTypeId === OPENSEARCH_SOURCE_TYPE_ID ? undefined : state.scope,
  };
  Object.keys(next).forEach((key) => next[key] === undefined && delete next[key]);
  return next as DrilldownAppState;
};
