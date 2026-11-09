/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TopNav } from './top_nav';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import {
  QueryExecutionStatus,
  EditorMode,
} from '../../../application/utils/state_management/types';
import { SupportLanguageType } from '../query_builder/query_builder';

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: (component: any) => component,
  toMountPoint: jest.fn(),
}));
jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../hooks/use_editor_operations', () => ({ useEditorOperations: jest.fn() }));
jest.mock('../query_builder/query_builder', () => ({
  // abortAllActiveQueries: jest.fn(), // removed; top nav cancels via container.cancelAll
  SupportLanguageType: {
    ppl: 'PPL',
    promQL: 'PROMQL',
    ai: 'AI',
    sql: 'SQL',
  },
}));
jest.mock('./query_execution_button', () => ({
  QueryExecutionButton: () => <div data-test-subj="query-execution-button" />,
}));

const mockTopNavMenu = jest.fn(({ screenTitle }: any) => (
  <div data-test-subj="top-nav-menu">{screenTitle}</div>
));

const buildQueryBuilderState = (options: Record<string, any> = {}) => ({
  queryEditorState: {
    queryStatus: { status: QueryExecutionStatus.UNINITIALIZED },
    editorMode: EditorMode.Query,
    userInitiatedQuery: false,
    // languageType: SupportLanguageType.ppl,
  },
  // The run handler reads the row's language from queryState.
  queryState: { query: 'source=logs', language: SupportLanguageType.ppl, dataset: undefined },
  datasetView: { dataView: undefined },
  queryBuilder: {
    updateQueryEditorState: jest.fn(),
    updateQueryState: jest.fn(),
    onQueryExecutionSubmit: jest.fn(),
    clearResultState: jest.fn(),
  },
  // Run / cancel act on every query row through the container.
  container: {
    executeAll: jest.fn(),
    cancelAll: jest.fn(),
  },
  ...options,
});

beforeEach(() => {
  jest.clearAllMocks();
  (useQueryBuilderState as jest.Mock).mockReturnValue(buildQueryBuilderState());
  (useEditorOperations as jest.Mock).mockReturnValue({
    getEditorRef: jest.fn().mockReturnValue({
      getValue: jest.fn().mockReturnValue('source=logs'),
    }),
    getEditorText: jest.fn().mockReturnValue('source=logs'),
  });
  (useOpenSearchDashboards as jest.Mock).mockReturnValue({
    services: {
      navigation: { ui: { TopNavMenu: mockTopNavMenu } },
      data: {},
    },
  });
});

describe('TopNav', () => {
  it('renders TopNavMenu', () => {
    const { getByTestId } = render(<TopNav />);
    expect(getByTestId('top-nav-menu')).toBeInTheDocument();
  });

  it('sets screenTitle to "Create" for new savedExplore', () => {
    const { getByText } = render(<TopNav />);
    expect(getByText('Create')).toBeInTheDocument();
  });

  it('sets screenTitle to "Edit <title>" when savedExplore has id', () => {
    const { getByText } = render(
      <TopNav savedExplore={{ id: '123', title: 'My Explore' } as any} />
    );
    expect(getByText('Edit My Explore')).toBeInTheDocument();
  });

  it('leaves cancelling to the custom submit button rather than the search bar', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({
        queryEditorState: {
          queryStatus: { status: QueryExecutionStatus.LOADING },
          userInitiatedQuery: true,
        },
      })
    );
    render(<TopNav />);
    const props = mockTopNavMenu.mock.calls[mockTopNavMenu.mock.calls.length - 1][0];
    expect(props.customSubmitButton).toBeDefined();
    expect(props).not.toHaveProperty('showCancelButton');
    expect(props).not.toHaveProperty('onQueryCancel');
    expect(props).not.toHaveProperty('isQueryRunning');
  });

  it('does not overwrite builder query from a missing editor before run', async () => {
    const queryBuilder = {
      updateQueryEditorState: jest.fn(),
      updateQueryState: jest.fn(),
      onQueryExecutionSubmit: jest.fn(),
      clearResultState: jest.fn(),
    };
    const state = buildQueryBuilderState({
      queryBuilder,
    });
    (useQueryBuilderState as jest.Mock).mockReturnValue(state);
    (useEditorOperations as jest.Mock).mockReturnValue({
      getEditorRef: jest.fn().mockReturnValue(null),
      getEditorText: jest.fn().mockReturnValue('source=stale_logs'),
    });

    render(<TopNav />);
    const props = mockTopNavMenu.mock.calls[mockTopNavMenu.mock.calls.length - 1][0];

    await props.onQuerySubmit();

    expect(queryBuilder.updateQueryState).not.toHaveBeenCalledWith({
      query: 'source=stale_logs',
    });
    // expect(queryBuilder.onQueryExecutionSubmit).toHaveBeenCalledTimes(1);
    expect(state.container.executeAll).toHaveBeenCalledTimes(1);
  });

  it('cancels every query row', () => {
    const state = buildQueryBuilderState();
    (useQueryBuilderState as jest.Mock).mockReturnValue(state);

    render(<TopNav />);
    const props = mockTopNavMenu.mock.calls[mockTopNavMenu.mock.calls.length - 1][0];
    const submitButton = props.customSubmitButton;
    submitButton.props.onCancel();

    expect(state.container.cancelAll).toHaveBeenCalledTimes(1);
  });
});
