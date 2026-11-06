/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryRowComponent, QueryRowProps } from './query_row';
import { PrometheusClient } from '../explore/services/prometheus_client';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({ value }: { value: string }) => (
    <textarea data-test-subj="codeEditor" value={value} readOnly />
  ),
}));

jest.mock('../promql_builder', () => ({
  ...jest.requireActual('../promql_builder'),
  PromQLBuilder: () => <div data-test-subj="promqlBuilder" />,
}));

jest.mock('./metrics_query_options', () => ({
  RowQueryOptions: () => <div data-test-subj="rowQueryOptions" />,
}));

const renderRow = (overrides: Partial<QueryRowProps> = {}) => {
  const props: QueryRowProps = {
    row: { id: 'row-1', mode: 'code', query: 'up', builderState: null },
    label: 'A',
    positionLabel: 'A',
    client: {} as PrometheusClient,
    onBuilderChange: jest.fn(),
    onCodeChange: jest.fn(),
    onModeChange: jest.fn(),
    onRemove: jest.fn(),
    onOptionsChange: jest.fn(),
    onRun: jest.fn(),
    languageTitle: 'PromQL',
    canRemove: true,
    isDragging: false,
    dragHandleProps: null,
    stepReadout: {} as QueryRowProps['stepReadout'],
    ...overrides,
  };
  return render(<QueryRowComponent {...props} />);
};

describe('QueryRowComponent', () => {
  it('shows the label and drag handle by default', () => {
    renderRow();

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument();
  });

  it('hides the label and drag handle column when showLabel is false', () => {
    renderRow({ showLabel: false });

    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
    // The editor itself still renders.
    expect(screen.getByTestId('codeEditor')).toBeInTheDocument();
  });
});
