/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { DatasetField } from '../../../../common';
import { SchemaMappings, SchemaMappingsProps } from './schema_mappings';
import { SchemaConfig } from './schema_config';

const mockSchemaConfig: SchemaConfig = {
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
    serviceName: {
      displayName: 'Service Name',
      description: 'Name of the service',
    },
    timestamp: {
      displayName: 'Timestamp',
      description: 'The time when the span started or when the event occurred',
      type: 'date',
    },
  },
};

const mockAvailableFields: DatasetField[] = [
  { name: 'field1', displayName: 'Field 1', type: 'string' },
  { name: 'field2', displayName: 'Field 2', type: 'string' },
  { name: 'timestamp_field', displayName: 'Timestamp Field', type: 'date' },
];

const defaultProps: SchemaMappingsProps = {
  availableFields: mockAvailableFields,
  schemaMappings: {},
  onChange: jest.fn(),
  schemas: [['otelLogs', mockSchemaConfig]],
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('SchemaMappings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the accordion with correct title', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    expect(screen.getByText('Schema Mappings')).toBeInTheDocument();
  });

  it('should render accordion component', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    const accordion = screen.getByTestId('schemaMappingsAccordion');
    expect(accordion).toBeInTheDocument();
  });

  it('should expand accordion when clicked', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    const accordionButton = screen.getByText('Schema Mappings');
    fireEvent.click(accordionButton);
    expect(screen.getByText('OTel logs')).toBeInTheDocument();
  });

  it('should render schema attributes after expanding accordion', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    fireEvent.click(screen.getByText('Schema Mappings'));

    expect(screen.getByText('Trace ID')).toBeInTheDocument();
    expect(screen.getByText('Span ID')).toBeInTheDocument();
    expect(screen.getByText('Service Name')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
  });

  it('should call onChange when a field is selected', () => {
    const mockOnChange = jest.fn();
    renderWithIntl(<SchemaMappings {...defaultProps} onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('Schema Mappings'));

    const select = screen.getByTestId('schemaMappingSelect-otelLogs-traceId');
    fireEvent.change(select, { target: { value: 'field1' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      otelLogs: {
        traceId: 'field1',
      },
    });
  });

  it('should remove attribute mapping when empty value is selected', () => {
    const mockOnChange = jest.fn();
    const propsWithMapping: SchemaMappingsProps = {
      ...defaultProps,
      schemaMappings: {
        otelLogs: {
          traceId: 'field1',
        },
      },
      onChange: mockOnChange,
    };

    renderWithIntl(<SchemaMappings {...propsWithMapping} />);
    fireEvent.click(screen.getByText('Schema Mappings'));

    const select = screen.getByTestId('schemaMappingSelect-otelLogs-traceId');
    fireEvent.change(select, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith({});
  });

  it('should filter fields by type when attribute has type specified', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    fireEvent.click(screen.getByText('Schema Mappings'));

    const timestampSelect = screen.getByTestId('schemaMappingSelect-otelLogs-timestamp');
    const options = timestampSelect.querySelectorAll('option');

    const optionValues = Array.from(options).map((option) => (option as HTMLOptionElement).value);
    expect(optionValues).toContain('timestamp_field');
    expect(optionValues).not.toContain('field1');
    expect(optionValues).not.toContain('field2');
  });

  it('should display current mapping value in select', () => {
    const propsWithMapping: SchemaMappingsProps = {
      ...defaultProps,
      schemaMappings: {
        otelLogs: {
          traceId: 'field1',
          spanId: 'field2',
        },
      },
    };

    renderWithIntl(<SchemaMappings {...propsWithMapping} />);
    fireEvent.click(screen.getByText('Schema Mappings'));

    const traceIdSelect = screen.getByTestId(
      'schemaMappingSelect-otelLogs-traceId'
    ) as HTMLSelectElement;
    const spanIdSelect = screen.getByTestId(
      'schemaMappingSelect-otelLogs-spanId'
    ) as HTMLSelectElement;

    expect(traceIdSelect.value).toBe('field1');
    expect(spanIdSelect.value).toBe('field2');
  });

  it('should handle multiple attribute changes independently', () => {
    const mockOnChange = jest.fn();
    renderWithIntl(<SchemaMappings {...defaultProps} onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('Schema Mappings'));

    const traceIdSelect = screen.getByTestId('schemaMappingSelect-otelLogs-traceId');
    fireEvent.change(traceIdSelect, { target: { value: 'field1' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      otelLogs: {
        traceId: 'field1',
      },
    });

    mockOnChange.mockClear();

    const spanIdSelect = screen.getByTestId('schemaMappingSelect-otelLogs-spanId');
    fireEvent.change(spanIdSelect, { target: { value: 'field2' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      otelLogs: {
        spanId: 'field2',
      },
    });
  });
});
