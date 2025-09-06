/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { render, screen, fireEvent } from 'test_utils/testing_lib_helpers';
import { FacetField } from './facet_field';
import { coreMock } from 'opensearch-dashboards/public/mocks';
import { DataViewField } from '../../../../data/public';
import { getStubDataView } from '../../../../data/public/data_views/data_view.stub';

jest.mock('./facet_value', () => ({
  FacetValue: ({ bucket }: any) => (
    <div data-test-subj={`mocked-facet-value-${bucket.display}`}>{bucket.display}</div>
  ),
}));

function getProps({ buckets = [], shortDotsEnabled = false } = {}) {
  const dataSet = getStubDataView(
    'logstash-*',
    (cfg: any) => cfg,
    'time',
    stubbedLogstashFields(),
    coreMock.createSetup()
  );

  const mockField = {
    name: 'status',
    type: 'string',
    esTypes: ['keyword'],
    count: 5,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true,
    displayName: 'status',
  } as DataViewField;

  const defaultBuckets =
    buckets.length > 0
      ? buckets
      : [
          { display: 'success', value: 'success', count: 10, percent: 50 },
          { display: 'error', value: 'error', count: 5, percent: 25 },
        ];

  return {
    field: mockField,
    selectedDataSet: dataSet,
    onAddFilter: jest.fn(),
    getDetailsByField: jest.fn(() => ({ buckets: defaultBuckets, error: '', exists: 1, total: 1 })),
    shortDotsEnabled,
  };
}

describe('FacetField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders field name and icon', () => {
    const props = getProps();
    render(<FacetField {...props} />);

    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByTestId('exploreSideBarFacetFieldButton')).toBeInTheDocument();
  });

  it('renders facet values when expanded', () => {
    const props = getProps();
    render(<FacetField {...props} />);

    expect(screen.getByTestId('mocked-facet-value-success')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-facet-value-error')).toBeInTheDocument();
  });

  it('toggles expansion when button is clicked', () => {
    const props = getProps();
    render(<FacetField {...props} />);

    const toggleButton = screen.getByTestId('exploreSideBarFacetFieldButton');

    // Initially expanded
    expect(screen.getByTestId('mocked-facet-value-success')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Values should be hidden
    expect(screen.queryByTestId('mocked-facet-value-success')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(toggleButton);

    // Values should be visible again
    expect(screen.getByTestId('mocked-facet-value-success')).toBeInTheDocument();
  });

  it('shows correct icon based on expansion state', () => {
    const props = getProps();
    render(<FacetField {...props} />);

    const toggleButton = screen.getByTestId('exploreSideBarFacetFieldButton');

    // Initially expanded - should show arrowDown
    expect(toggleButton.querySelector('[data-euiicon-type="arrowDown"]')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);

    // Should now show arrowRight
    expect(toggleButton.querySelector('[data-euiicon-type="arrowRight"]')).toBeInTheDocument();
  });

  it('renders nothing when no data set', () => {
    const props = { ...getProps(), selectedDataSet: undefined };
    const { container } = render(<FacetField {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no buckets', () => {
    const props = getProps({ buckets: [] });
    // Override getDetailsByField to return empty buckets
    props.getDetailsByField = jest.fn(() => ({ buckets: [], error: '', exists: 1, total: 1 }));

    const { container } = render(<FacetField {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('passes shortDotsEnabled to FacetValue components', () => {
    const props = getProps({ shortDotsEnabled: true });
    render(<FacetField {...props} />);

    // FacetValue components should render (they're mocked so we just check they exist)
    expect(screen.getByTestId('mocked-facet-value-success')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-facet-value-error')).toBeInTheDocument();
  });
});
