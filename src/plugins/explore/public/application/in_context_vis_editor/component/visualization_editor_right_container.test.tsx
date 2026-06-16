/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RightStyleOptionsPanel } from './visualization_editor_right_container';
import { QueryExecutionStatus } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options.defaultMessage),
  },
}));
jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../hooks/use_visualization_builder', () => ({ useVisualizationBuilder: jest.fn() }));
jest.mock('../query_builder/query_builder', () => ({}));
jest.mock('@osd/i18n/react', () => ({
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => <>{defaultMessage}</>,
}));

jest.mock('../../utils/state_management/types', () => ({
  QueryExecutionStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    NO_RESULTS: 'none',
    ERROR: 'error',
  },
}));

const mockRenderStylePanel = jest.fn().mockReturnValue(<div data-test-subj="style-panel" />);

const buildState = (status: string, options?: any) => ({
  queryEditorState: {
    queryStatus: { status, error: options },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  (useVisualizationBuilder as jest.Mock).mockReturnValue({
    visualizationBuilderForEditor: { renderStylePanel: mockRenderStylePanel },
  });
});

describe('RightStyleOptionsPanel', () => {
  it('renders empty state when UNINITIALIZED', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState(QueryExecutionStatus.UNINITIALIZED)
    );
    render(<RightStyleOptionsPanel />);
    expect(screen.getByText('Visualize')).toBeInTheDocument();
    expect(
      screen.getByText('Run a query to start seeing suggested visualizations')
    ).toBeInTheDocument();
  });

  it('renders empty state when NO_RESULTS', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(
      buildState(QueryExecutionStatus.NO_RESULTS)
    );
    render(<RightStyleOptionsPanel />);
    expect(screen.getByText('Visualize')).toBeInTheDocument();
  });

  it('renders loading spinner when LOADING', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(buildState(QueryExecutionStatus.LOADING));
    render(<RightStyleOptionsPanel />);
    expect(screen.getByTestId('loadingSpinner')).toBeInTheDocument();
    expect(mockRenderStylePanel).not.toHaveBeenCalled();
  });

  it('renders style panel when READY', () => {
    (useQueryBuilderState as jest.Mock).mockReturnValue(buildState(QueryExecutionStatus.READY));
    render(<RightStyleOptionsPanel />);
    expect(screen.getByTestId('style-panel')).toBeInTheDocument();
    expect(mockRenderStylePanel).toHaveBeenCalledWith({ className: 'visStylePanelBody' });
  });
});
