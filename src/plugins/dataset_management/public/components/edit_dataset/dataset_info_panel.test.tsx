/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DatasetInfoPanel } from './dataset_info_panel';
import { IntlProvider } from 'react-intl';

// Mock getSchemaConfigs
jest.mock('../../../../data/public', () => ({
  getSchemaConfigs: jest.fn(() => ({
    otelLogs: {
      displayName: 'OTel logs',
      description: 'OTel schema mappings for your logs dataset',
      signalType: 'logs',
      attributes: {
        traceId: {
          displayName: 'Trace ID',
          description: 'Unique identifier for the trace',
        },
        spanId: {
          displayName: 'Span ID',
          description: 'Unique identifier for the span',
        },
      },
    },
  })),
}));

const createMockDataset = (overrides = {}) => ({
  id: 'test-dataset',
  title: 'test-index',
  signalType: 'logs',
  timeFieldName: '@timestamp',
  dataSourceRef: undefined,
  schemaMappings: undefined,
  savedObjectsClient: {
    get: jest.fn(),
  },
  ...overrides,
});

describe('DatasetInfoPanel', () => {
  const renderComponent = (dataset: any, editConfiguration?: () => void) => {
    return render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <DatasetInfoPanel dataset={dataset} editConfiguration={editConfiguration} />
      </IntlProvider>
    );
  };

  it('renders basic dataset information', () => {
    const dataset = createMockDataset();
    renderComponent(dataset);

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('logs')).toBeInTheDocument();
    expect(screen.getByText('Data scope')).toBeInTheDocument();
    expect(screen.getByText('test-index')).toBeInTheDocument();
  });

  it('displays N/A when no schema mappings exist', () => {
    const dataset = createMockDataset();
    renderComponent(dataset);

    expect(screen.getByText('Schema mapping')).toBeInTheDocument();
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });

  it('displays schema mappings with display names', () => {
    const dataset = createMockDataset({
      schemaMappings: {
        otelLogs: {
          traceId: 'trace.id',
          spanId: 'span.id',
        },
      },
    });
    renderComponent(dataset);

    expect(screen.getByText('OTel logs')).toBeInTheDocument();
    expect(screen.getByText('Trace ID')).toBeInTheDocument();
    expect(screen.getByText('trace.id')).toBeInTheDocument();
    expect(screen.getByText('Span ID')).toBeInTheDocument();
    expect(screen.getByText('span.id')).toBeInTheDocument();
  });

  it('limits display to 4 mappings and shows "X more" message', () => {
    const dataset = createMockDataset({
      schemaMappings: {
        otelLogs: {
          traceId: 'trace.id',
          spanId: 'span.id',
        },
        otherSchema: {
          field1: 'field_1',
          field2: 'field_2',
          field3: 'field_3',
          field4: 'field_4',
        },
      },
    });
    renderComponent(dataset);

    // Should show "2 more" since we have 6 total mappings but limit to 4
    expect(screen.getByText('2 more')).toBeInTheDocument();
  });

  it('renders edit button when editConfiguration is provided', () => {
    const dataset = createMockDataset({
      schemaMappings: {
        otelLogs: {
          traceId: 'trace.id',
        },
      },
    });
    const editConfiguration = jest.fn();
    renderComponent(dataset, editConfiguration);

    const editButton = screen.getByTestId('editSchemaConfigurationButton');
    expect(editButton).toBeInTheDocument();
  });

  it('does not render edit button when editConfiguration is not provided', () => {
    const dataset = createMockDataset({
      schemaMappings: {
        otelLogs: {
          traceId: 'trace.id',
        },
      },
    });
    renderComponent(dataset);

    const editButton = screen.queryByTestId('editSchemaConfigurationButton');
    expect(editButton).toBeNull();
  });

  it('displays data source as N/A when no dataSourceRef exists', () => {
    const dataset = createMockDataset();
    renderComponent(dataset);

    expect(screen.getByText('Data scope')).toBeInTheDocument();
    const naElements = screen.getAllByText('N/A');
    // Should have N/A for data source and schema mapping
    expect(naElements.length).toBeGreaterThanOrEqual(1);
  });
});
