/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { DatasetField } from '../../../../common';
import { MAX_SELECT_OPTIONS, SchemaMappings, SchemaMappingsProps } from './schema_mappings';
import { SchemaConfig } from './schema_config';

const mockSchemaConfig: SchemaConfig = {
  displayName: 'OTel logs - optional',
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
  // @ts-expect-error TS2769 TODO(ts-error): fixme
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('SchemaMappings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the accordion with correct title', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    expect(screen.getByText('Schema Mappings')).toBeInTheDocument();
    expect(screen.getByText('– optional')).toBeInTheDocument();
  });

  it('should render accordion component', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    const accordion = screen.getByTestId('schemaMappingsAccordion');
    expect(accordion).toBeInTheDocument();
  });

  it('should toggle accordion when clicked', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);

    const accordion = screen.getByTestId('schemaMappingsAccordion');
    const accordionButton = accordion.querySelector('button');

    // Click to open
    fireEvent.click(accordionButton!);
    expect(screen.getByText('OTel logs - optional')).toBeInTheDocument();

    // Click to close
    fireEvent.click(accordionButton!);
    // Content may still be in DOM but accordion should toggle
  });

  it('should render schema attributes after expanding accordion', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    const accordion = screen.getByTestId('schemaMappingsAccordion');
    const accordionButton = accordion.querySelector('button');
    fireEvent.click(accordionButton!);

    expect(screen.getByText('Trace ID')).toBeInTheDocument();
    expect(screen.getByText('Span ID')).toBeInTheDocument();
    expect(screen.getByText('Service Name')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
  });

  it('should call onChange when a field is selected', () => {
    const mockOnChange = jest.fn();
    renderWithIntl(<SchemaMappings {...defaultProps} onChange={mockOnChange} />);
    const accordion = screen.getByTestId('schemaMappingsAccordion');
    const accordionButton = accordion.querySelector('button');
    fireEvent.click(accordionButton!);

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
    // Accordion auto-opens because mappings already exist
    const select = screen.getByTestId('schemaMappingSelect-otelLogs-traceId');
    fireEvent.change(select, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith({});
  });

  it('should filter fields by type when attribute has type specified', () => {
    renderWithIntl(<SchemaMappings {...defaultProps} />);
    const accordion = screen.getByTestId('schemaMappingsAccordion');
    const accordionButton = accordion.querySelector('button');
    fireEvent.click(accordionButton!);

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
    // Accordion auto-opens because mappings already exist
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
    const accordion = screen.getByTestId('schemaMappingsAccordion');
    const accordionButton = accordion.querySelector('button');
    fireEvent.click(accordionButton!);

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

  it('should auto-open accordion when there are existing schema mappings', () => {
    const propsWithMapping: SchemaMappingsProps = {
      ...defaultProps,
      schemaMappings: {
        otelLogs: {
          traceId: 'field1',
        },
      },
    };

    renderWithIntl(<SchemaMappings {...propsWithMapping} />);

    // Accordion should be auto-opened, so schema details should be visible without clicking
    expect(screen.getByText('OTel logs - optional')).toBeInTheDocument();
    expect(screen.getByText('Trace ID')).toBeInTheDocument();
  });

  describe('with many fields', () => {
    const manyFields: DatasetField[] = Array.from({ length: MAX_SELECT_OPTIONS + 1 }, (_, i) => ({
      name: `field_${i}`,
      displayName: `field_${i}`,
      type: 'string',
    }));

    it('should not render any field options while the accordion is closed', () => {
      const { container } = renderWithIntl(
        <SchemaMappings {...defaultProps} availableFields={manyFields} />
      );
      expect(container.querySelectorAll('option')).toHaveLength(0);
      expect(screen.queryByTestId('schemaMappingSelect-otelLogs-traceId')).not.toBeInTheDocument();
    });

    it('should use a combo box instead of a select above the option limit', () => {
      const { container } = renderWithIntl(
        <SchemaMappings {...defaultProps} availableFields={manyFields} />
      );
      fireEvent.click(screen.getByTestId('schemaMappingsAccordion').querySelector('button')!);

      expect(screen.getByTestId('schemaMappingSelect-otelLogs-traceId')).toBeInTheDocument();
      expect(container.querySelectorAll('option').length).toBeLessThan(MAX_SELECT_OPTIONS);
    });

    it('should call onChange when a field is chosen in the combo box', () => {
      const mockOnChange = jest.fn();
      renderWithIntl(
        <SchemaMappings {...defaultProps} availableFields={manyFields} onChange={mockOnChange} />
      );
      fireEvent.click(screen.getByTestId('schemaMappingsAccordion').querySelector('button')!);

      const combo = screen.getByTestId('schemaMappingSelect-otelLogs-traceId');
      const input = combo.querySelector('input')!;
      fireEvent.change(input, { target: { value: 'field_5' } });
      fireEvent.keyDown(input, { key: 'ArrowDown', keyCode: 40 });
      fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });

      expect(mockOnChange).toHaveBeenCalled();
      const mapped = mockOnChange.mock.calls[0][0].otelLogs.traceId;
      expect(mapped).toMatch(/^field_5/);
    });
  });
});
