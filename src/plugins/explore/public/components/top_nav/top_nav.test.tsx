/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BehaviorSubject, Subject } from 'rxjs';
import { TopNav } from './top_nav';
import { rootReducer } from '../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { cancelPPLAnalyze, runPPLAnalyzeInBackground } from '../../../../data/public';
import { abortAllActiveQueries } from '../../application/utils/state_management/actions/query_actions';
import { onEditorRunActionCreator } from '../../application/utils/state_management/actions/query_editor/on_editor_run/on_editor_run';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(),
}));
jest.mock('../../../../opensearch_dashboards_utils/public', () => ({
  ...jest.requireActual('../../../../opensearch_dashboards_utils/public'),
  useOpenOnUrlMarker: jest.fn(),
}));
jest.mock('../../../../data/public', () => ({
  ResultStatus: jest.requireActual('../../../../data/public').ResultStatus,
  useSyncQueryStateWithUrl: jest.fn(() => ({ startSyncingQueryStateWithUrl: jest.fn() })),
  runPPLAnalyzeInBackground: jest.fn(),
  cancelPPLAnalyze: jest.fn(),
}));
jest.mock('../../../../navigation/public', () => ({
  TopNavMenuItemRenderType: { IN_PLACE: 'in_place', IN_PORTAL: 'in_portal' },
}));
jest.mock('../../application/context', () => ({
  useDatasetContext: jest.fn(() => ({ dataset: { isTimeBased: () => true } })),
}));
jest.mock('../../helpers/use_flavor_id', () => ({ useFlavorId: jest.fn(() => 'logs') }));
jest.mock('./top_nav_links', () => ({ getTopNavLinks: jest.fn(() => []) }));
jest.mock('./top_nav_links/top_nav_open/top_nav_open', () => ({ getOpenButtonRun: jest.fn() }));
jest.mock('./top_nav_links/top_nav_save/top_nav_save', () => ({ getSaveButtonRun: jest.fn() }));
jest.mock('../../application/hooks', () => ({
  useClearEditors: jest.fn(() => jest.fn()),
  useEditorRef: jest.fn(() => ({ current: { getValue: () => 'source=logs | head 5' } })),
}));
jest.mock(
  '../../application/utils/state_management/actions/query_editor/on_editor_run/on_editor_run',
  () => ({
    onEditorRunActionCreator: jest.fn(() => ({ type: 'test/onEditorRun' })),
  })
);
jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  abortAllActiveQueries: jest.fn(),
}));

const mockQueryExecutionButton = jest.fn((_props: any) => (
  <div data-test-subj="query-execution-button" />
));
jest.mock('./query_execution_button', () => ({
  QueryExecutionButton: (props: any) => mockQueryExecutionButton(props),
}));

const mockTopNavMenu = jest.fn((_props: any) => <div data-test-subj="top-nav-menu" />);

const renderTopNav = (chromeVisible = true) => {
  const store = configureStore({ reducer: rootReducer });
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  (useOpenSearchDashboards as jest.Mock).mockReturnValue({
    services: {
      data: {
        query: {
          filterManager: { getFilters: jest.fn(() => []) },
          queryString: { getQuery: jest.fn(() => ({ query: 'source=logs', language: 'PPL' })) },
          timefilter: { timefilter: { getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })) } },
          state$: new Subject(),
        },
      },
      navigation: { ui: { TopNavMenu: mockTopNavMenu } },
      chrome: { getIsVisible$: () => new BehaviorSubject(chromeVisible) },
      osdUrlStateStorage: {},
      tabRegistry: { getTab: jest.fn() },
      http: {},
    },
  });
  render(
    <Provider store={store}>
      <TopNav />
    </Provider>
  );
  const menuProps = mockTopNavMenu.mock.calls[mockTopNavMenu.mock.calls.length - 1][0];
  const buttonProps =
    mockQueryExecutionButton.mock.calls[mockQueryExecutionButton.mock.calls.length - 1]?.[0];
  return { store, dispatchSpy, menuProps, buttonProps };
};

describe('TopNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('supplies its own run/stop control and leaves cancelling out of the search bar', () => {
    const { menuProps } = renderTopNav();

    expect(menuProps.customSubmitButton).toBeDefined();
    expect(menuProps).not.toHaveProperty('showCancelButton');
    expect(menuProps).not.toHaveProperty('onQueryCancel');
    expect(menuProps).not.toHaveProperty('isQueryRunning');
  });

  it('runs the query in the editor when the control is clicked', () => {
    const { menuProps, dispatchSpy } = renderTopNav();
    render(menuProps.customSubmitButton);
    mockQueryExecutionButton.mock.calls[0][0].onClick();

    expect(onEditorRunActionCreator).toHaveBeenCalledWith(
      expect.anything(),
      'source=logs | head 5'
    );
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'test/onEditorRun' });
    expect(runPPLAnalyzeInBackground).toHaveBeenCalledWith(
      expect.objectContaining({ onlyIfOpen: true })
    );
  });

  it('stops every running query and resets the page when the control is stopped', () => {
    const { menuProps, store } = renderTopNav();
    render(menuProps.customSubmitButton);
    mockQueryExecutionButton.mock.calls[0][0].onCancel();

    expect(abortAllActiveQueries).toHaveBeenCalledTimes(1);
    expect(cancelPPLAnalyze).toHaveBeenCalledTimes(1);
    const { queryEditor, results } = store.getState();
    expect(queryEditor.hasUserInitiatedQuery).toBe(false);
    expect(queryEditor.overallQueryStatus.status).toBe(QueryExecutionStatus.UNINITIALIZED);
    expect(results).toEqual({});
  });

  it('keeps the control when embedded without chrome', () => {
    const { menuProps } = renderTopNav(false);

    expect(menuProps.customSubmitButton).toBeDefined();
    expect(menuProps.config).toEqual([]);
    expect(menuProps.showDatePicker).toBe('in_place');
  });
});
