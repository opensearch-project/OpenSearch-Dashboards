/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { SourceQueryPanelEditor } from './source_query_panel_editor';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import type { SourceTypeQueryEditorProps } from '../../../services/source_type_registry';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({ services: mockServices }),
  withOpenSearchDashboards: jest.fn((component) => component),
}));
jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));

const addError = jest.fn();
const mockServices = { data: { mock: 'data' }, notifications: { toasts: { addError } } };

let editorProps: SourceTypeQueryEditorProps;
const MyEditor: React.FC<SourceTypeQueryEditorProps> = (props) => {
  editorProps = props;
  return <div data-test-subj="mySourceEditor">{props.query}</div>;
};

const dataset = { id: 'ds', title: 'ds', type: 'MY_DATASET_TYPE' };
const setup = (
  queryStatus: Record<string, unknown> = { status: QueryExecutionStatus.UNINITIALIZED }
) => {
  const queryBuilder = {
    updateQueryState: jest.fn(),
    updateQueryEditorState: jest.fn(),
    updateQueryOptions: jest.fn(),
    onQueryExecutionSubmit: jest.fn(async () => {}),
  };
  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryState: {
      query: 'SELECT 1',
      language: 'MY_SQL',
      dataset,
      queryOptions: { maxDataPoints: 10 },
    },
    queryEditorState: { isQueryEditorDirty: false, queryStatus },
    queryBuilder,
  });
  render(<SourceQueryPanelEditor editor={MyEditor} />);
  return queryBuilder;
};

describe('SourceQueryPanelEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the source's editor with the visualization's query", () => {
    setup();
    expect(screen.getByTestId('mySourceEditor')).toHaveTextContent('SELECT 1');
    expect(editorProps).toMatchObject({
      languageId: 'MY_SQL',
      dataset,
      data: mockServices.data,
      queryOptions: { maxDataPoints: 10 },
      status: { isRunning: false, error: undefined },
    });
  });

  it('writes edits and options to the query builder', () => {
    const queryBuilder = setup();
    act(() => editorProps.onChange('SELECT 2'));
    expect(queryBuilder.updateQueryState).toHaveBeenCalledWith({ query: 'SELECT 2' });
    expect(queryBuilder.updateQueryEditorState).toHaveBeenCalledWith({
      isQueryEditorDirty: true,
    });

    act(() => editorProps.onQueryOptionsChange({ maxDataPoints: 20 }));
    expect(queryBuilder.updateQueryOptions).toHaveBeenCalledWith({ maxDataPoints: 20 });
  });

  it('runs through the query builder, applying the text it is given first', () => {
    const queryBuilder = setup();
    act(() => editorProps.onRun('SELECT 3'));
    expect(queryBuilder.updateQueryState).toHaveBeenCalledWith({ query: 'SELECT 3' });
    expect(queryBuilder.onQueryExecutionSubmit).toHaveBeenCalled();
  });

  it('passes the running state and the error details to the editor', () => {
    setup({
      status: QueryExecutionStatus.ERROR,
      error: { error: 'Bad Request', message: { details: 'syntax error', reason: 'bad' } },
    });
    expect(editorProps.status).toEqual({ isRunning: false, error: 'syntax error' });
  });
});
