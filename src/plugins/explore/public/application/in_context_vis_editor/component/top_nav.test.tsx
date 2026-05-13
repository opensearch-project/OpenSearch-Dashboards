/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TopNav } from './top_nav';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import {
  QueryExecutionStatus,
  EditorMode,
} from '../../../application/utils/state_management/types';

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: (component: any) => component,
  toMountPoint: jest.fn(),
}));
jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../query_builder/query_builder', () => ({ abortAllActiveQueries: jest.fn() }));
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
  },
  datasetView: { dataView: undefined },
  queryBuilder: {
    updateQueryEditorState: jest.fn(),
    updateQueryState: jest.fn(),
    onQueryExecutionSubmit: jest.fn(),
    clearResultState: jest.fn(),
  },
  ...options,
});

beforeEach(() => {
  jest.clearAllMocks();
  (useQueryBuilderState as jest.Mock).mockReturnValue(buildQueryBuilderState());
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

  it('passes shouldShowCancelButton=true when loading and user-initiated', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildQueryBuilderState({
        queryEditorState: {
          queryStatus: { status: QueryExecutionStatus.LOADING },
          userInitiatedQuery: true,
        },
      })
    );
    render(<TopNav />);
    expect(mockTopNavMenu).toHaveBeenCalledWith(
      expect.objectContaining({ showCancelButton: true }),
      expect.anything()
    );
  });
});
