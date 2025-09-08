/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { render, screen, fireEvent } from 'test_utils/testing_lib_helpers';
import { FacetList } from './facet_list';
import { coreMock } from 'opensearch-dashboards/public/mocks';
import { DataViewField } from '../../../../data/public';
import { getStubDataView } from '../../../../data/public/data_views/data_view.stub';

jest.mock('./facet_field', () => ({
  FacetField: ({ field }: { field: any }) => (
    <div data-test-subj={`mocked-facet-field-${field.name}`}>{field.name}</div>
  ),
}));

function getProps({
  title = 'Test Facets',
  fields = undefined,
  shortDotsEnabled = false,
}: {
  title?: string;
  fields?: any;
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
      name: 'status',
      type: 'string',
      esTypes: ['keyword'],
      count: 5,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'status',
    } as DataViewField,
    {
      name: 'level',
      type: 'string',
      esTypes: ['keyword'],
      count: 3,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      displayName: 'level',
    } as DataViewField,
  ];

  const mockFields = fields !== undefined ? fields : defaultFields;

  return {
    title,
    fields: mockFields,
    selectedDataSet: dataSet,
    onAddFilter: jest.fn(),
    getDetailsByField: jest.fn(() => ({ buckets: [], error: '', exists: 1, total: 1 })),
    shortDotsEnabled,
    // Add missing required properties from DiscoverSidebarProps
    columns: [],
    fieldCounts: {},
    hits: [],
    onAddField: jest.fn(),
    onRemoveField: jest.fn(),
    onReorderFields: jest.fn(),
    isEnhancementsEnabledOverride: false,
  };
}

describe('FacetList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders facet list with title', () => {
    const props = getProps({ title: 'Available Facets' });
    render(<FacetList {...props} />);

    expect(screen.getByText('Available Facets')).toBeInTheDocument();
    expect(screen.getByTestId('exploreSideBarFieldGroupButton')).toBeInTheDocument();
  });

  it('renders facet field items when expanded', () => {
    const props = getProps();
    render(<FacetList {...props} />);

    expect(screen.getByTestId('mocked-facet-field-status')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-facet-field-level')).toBeInTheDocument();
  });

  it('toggles expansion when button is clicked', () => {
    const props = getProps();
    render(<FacetList {...props} />);

    const toggleButton = screen.getByTestId('exploreSideBarFieldGroupButton');

    // Initially expanded
    expect(screen.getByTestId('mocked-facet-field-status')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Fields should be hidden
    expect(screen.queryByTestId('mocked-facet-field-status')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(toggleButton);

    // Fields should be visible again
    expect(screen.getByTestId('mocked-facet-field-status')).toBeInTheDocument();
  });

  it('shows correct icon based on expansion state', () => {
    const props = getProps();
    render(<FacetList {...props} />);

    const toggleButton = screen.getByTestId('exploreSideBarFieldGroupButton');

    // Initially expanded - should show arrowDown
    expect(toggleButton.querySelector('[data-euiicon-type="arrowDown"]')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Should now show arrowRight
    expect(toggleButton.querySelector('[data-euiicon-type="arrowRight"]')).toBeInTheDocument();
  });

  it('renders nothing when selectedDataSet is null', () => {
    const props = { ...getProps(), selectedDataSet: undefined };
    const { container } = render(<FacetList {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('handles empty fields array', () => {
    const props = getProps({ fields: [] });
    render(<FacetList {...props} />);

    expect(screen.getByText('Test Facets')).toBeInTheDocument();
    expect(screen.queryByTestId('mocked-facet-field-status')).not.toBeInTheDocument();
  });
});
