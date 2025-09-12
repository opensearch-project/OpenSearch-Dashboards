/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { render, screen, fireEvent } from 'test_utils/testing_lib_helpers';
import { FieldList } from './field_list';
import { coreMock } from 'opensearch-dashboards/public/mocks';
import { DataViewField } from '../../../../data/public';
import { getStubDataView } from '../../../../data/public/data_views/data_view.stub';

jest.mock('./discover_field', () => ({
  DiscoverField: ({ field }: { field: DataViewField }) => (
    <div data-test-subj={`mocked-discover-field-${field.name}`}>{field.name}</div>
  ),
}));

function getProps({
  category = 'discovered',
  title = 'Test Fields',
  fields,
  shortDotsEnabled = false,
}: {
  category?: 'query' | 'discovered' | 'selected';
  title?: string;
  fields?: DataViewField[];
  shortDotsEnabled?: boolean;
} = {}) {
  const dataSet = getStubDataView(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    stubbedLogstashFields(),
    coreMock.createSetup()
  );

  const defaultFields = [
    {
      name: 'bytes',
      type: 'number',
      esTypes: ['long'],
      count: 10,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'bytes',
    } as DataViewField,
    {
      name: 'extension',
      type: 'string',
      esTypes: ['keyword'],
      count: 5,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'extension',
    } as DataViewField,
  ];

  const mockFields = fields !== undefined ? fields : defaultFields;

  return {
    category,
    title,
    fields: mockFields,
    columns: ['@timestamp'],
    selectedDataSet: dataSet,
    onAddField: jest.fn(),
    onRemoveField: jest.fn(),
    onAddFilter: jest.fn(),
    getDetailsByField: jest.fn(() => ({ buckets: [], error: '', exists: 1, total: 1 })),
    shortDotsEnabled,
    fieldCounts: {},
    hits: [],
    onReorderFields: jest.fn(),
    isEnhancementsEnabledOverride: false,
  };
}

describe('FieldList', () => {
  it('renders field list with title', () => {
    const props = getProps({ title: 'Available Fields' });
    render(<FieldList {...props} />);

    expect(screen.getByText('Available Fields')).toBeInTheDocument();
    expect(screen.getByTestId('dscSideBarFieldGroupButton')).toBeInTheDocument();
  });

  it('renders field items when expanded', () => {
    const props = getProps();
    render(<FieldList {...props} />);

    expect(screen.getByTestId('mocked-discover-field-bytes')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-discover-field-extension')).toBeInTheDocument();
  });

  it('toggles expansion when button is clicked', () => {
    const props = getProps();
    render(<FieldList {...props} />);

    const toggleButton = screen.getByTestId('dscSideBarFieldGroupButton');

    // Initially expanded
    expect(screen.getByTestId('mocked-discover-field-bytes')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Fields should be hidden
    expect(screen.queryByTestId('mocked-discover-field-bytes')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(toggleButton);

    // Fields should be visible again
    expect(screen.getByTestId('mocked-discover-field-bytes')).toBeInTheDocument();
  });

  it('renders nothing when selectedDataSet is null', () => {
    const props = { ...getProps(), selectedDataSet: undefined };
    const { container } = render(<FieldList {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('shows correct icon based on expansion state', () => {
    const props = getProps();
    render(<FieldList {...props} />);

    const toggleButton = screen.getByTestId('dscSideBarFieldGroupButton');

    // Initially expanded - should show arrowDown
    expect(toggleButton.querySelector('[data-euiicon-type="arrowDown"]')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Should now show arrowRight
    expect(toggleButton.querySelector('[data-euiicon-type="arrowRight"]')).toBeInTheDocument();
  });

  it('handles empty fields array', () => {
    const props = getProps({ fields: [] });
    render(<FieldList {...props} />);

    expect(screen.getByText('Test Fields')).toBeInTheDocument();
    expect(screen.queryByTestId('mocked-discover-field-bytes')).not.toBeInTheDocument();
  });
});
