/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  slice as visualizationSlice,
  VisualizationState,
  setIndexPattern,
  setSearchField,
  editDraftAgg,
  saveDraftAgg,
  updateAggConfigParams,
  setAggParamValue,
  reorderAgg,
  setSavedQuery,
  setState,
} from './visualization_slice';
import { CreateAggConfigParams } from '../../../../../data/common';

describe('visualizationSlice', () => {
  let initialState: VisualizationState;

  beforeEach(() => {
    initialState = {
      searchField: '',
      activeVisualization: {
        name: 'some-vis',
        aggConfigParams: [],
      },
      savedQuery: undefined,
    } as VisualizationState;
  });

  it('should handle setIndexPattern', () => {
    const indexPattern = 'new-index-pattern';
    const action = setIndexPattern(indexPattern);
    const result = visualizationSlice.reducer(initialState, action);
    expect(result.indexPattern).toEqual(indexPattern);
  });

  it('should handle setSearchField', () => {
    const searchField = 'new-search-field';
    const action = setSearchField(searchField);
    const result = visualizationSlice.reducer(initialState, action);
    expect(result.searchField).toEqual(searchField);
  });

  it('should handle editDraftAgg', () => {
    const draftAgg: CreateAggConfigParams = { id: '1', enabled: true, type: 'count', params: {} };
    const action = editDraftAgg(draftAgg);
    const result = visualizationSlice.reducer(initialState, action);
    expect(result.activeVisualization?.draftAgg).toEqual(draftAgg);
  });

  it('should handle saveDraftAgg', () => {
    const draftAgg: CreateAggConfigParams = { id: '1', enabled: true, type: 'count', params: {} };
    const stateWithDraft = {
      ...initialState,
      activeVisualization: {
        name: 'some-name',
        draftAgg,
        aggConfigParams: [],
      },
    };
    const action = saveDraftAgg(undefined);
    const result = visualizationSlice.reducer(stateWithDraft, action);
    expect(result.activeVisualization?.aggConfigParams).toContain(draftAgg);
  });

  it('should handle updateAggConfigParams', () => {
    const newAggConfigParams: CreateAggConfigParams[] = [
      { id: '2', enabled: true, type: 'avg', params: {} },
    ];
    const action = updateAggConfigParams(newAggConfigParams);
    const result = visualizationSlice.reducer(initialState, action);
    expect(result.activeVisualization?.aggConfigParams).toEqual(newAggConfigParams);
  });

  it('should handle setAggParamValue', () => {
    const aggParamValue = { aggId: '1', paramName: 'field', value: 'newField' };
    const action = setAggParamValue(aggParamValue);

    const initialStateWithAgg = {
      ...initialState,
      activeVisualization: {
        ...initialState.activeVisualization,
        name: 'defaultName',
        aggConfigParams: [{ id: '1', enabled: true, type: 'count', params: {} }],
      },
    };

    const result = visualizationSlice.reducer(initialStateWithAgg, action);
    expect(
      result.activeVisualization?.aggConfigParams?.[0]?.params?.[aggParamValue.paramName]
    ).toEqual(aggParamValue.value);
  });

  it('should handle reorderAgg', () => {
    const reorderAction = { sourceId: '1', destinationId: '2' };
    const action = reorderAgg(reorderAction);

    // Initial state with multiple aggregations
    const initialStateWithMultipleAggs = {
      ...initialState,
      activeVisualization: {
        ...initialState.activeVisualization,
        name: 'defaultName',
        aggConfigParams: [
          { id: '1', enabled: true, type: 'count', params: {} },
          { id: '2', enabled: true, type: 'avg', params: {} },
        ],
      },
    };

    const result = visualizationSlice.reducer(initialStateWithMultipleAggs, action);
    // verify the order of aggConfigParams
    expect(result.activeVisualization?.aggConfigParams[0].id).toEqual('2');
    expect(result.activeVisualization?.aggConfigParams[1].id).toEqual('1');
  });

  it('should handle savedQueryId by setSavedQuery', () => {
    const savedQueryId = 'some-query-id';
    const action = setSavedQuery(savedQueryId);
    const result = visualizationSlice.reducer(initialState, action) as VisualizationState;
    expect(result.savedQuery).toEqual(savedQueryId);
  });

  it('should handle undefined savedQueryId by setSavedQuery', () => {
    const savedQueryId = undefined;
    const action = setSavedQuery(savedQueryId);
    const result = visualizationSlice.reducer(initialState, action) as VisualizationState;
    expect(result.savedQuery).toBeUndefined();
  });

  it('should handle setState', () => {
    const newState = {
      searchField: 'new-search-field',
      activeVisualization: {
        name: 'new-vis',
        aggConfigParams: [],
      },
    };
    const action = setState(newState);
    const result = visualizationSlice.reducer(initialState, action);
    expect(result).toEqual(newState);
  });
});
