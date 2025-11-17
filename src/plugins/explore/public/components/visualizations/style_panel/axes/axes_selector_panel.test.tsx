/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AxisRole, VisColumn, VisFieldType } from '../../types';
import { ChartType } from '../../utils/use_visualization_types';
import { ALL_VISUALIZATION_RULES } from '../../rule_repository';
import { AxesSelectPanel } from './axes_selector_panel';

const mockVisualizationRegistry = {
  getVisualizationConfig: jest.fn(),
  findRuleByAxesMapping: jest.fn(),
};

jest.mock('../../utils/use_visualization_types', () => ({
  useVisualizationRegistry: () => mockVisualizationRegistry,
}));

jest.mock('../../rule_repository', () => ({
  ALL_VISUALIZATION_RULES: [
    {
      id: 'rule1',
      matchIndex: [1, 1, 0],
    },
    {
      id: 'rule2',
      matchIndex: [2, 0, 1],
    },
  ],
}));

jest.mock('../../visualization_builder_utils', () => {
  // Import the constants directly to avoid referencing out-of-scope variables
  const X = 'x';
  const CATEGORICAL = 'categorical';

  return {
    getColumnMatchFromMapping: jest.fn((mapping) => {
      // Simple mock implementation to return different values based on mapping
      if (mapping && mapping[0] && mapping[0][X] && mapping[0][X].type === CATEGORICAL) {
        return [1, 1, 0]; // Rule 1
      }
      return [2, 0, 1]; // Rule 2
    }),
  };
});

jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiComboBox: jest.fn(({ onChange, options }) => (
    <select
      role="combobox"
      onBlur={(e) => {
        if (onChange && e.target.value) {
          onChange([{ label: e.target.value }]);
        }
      }}
    >
      <option value="">Select field</option>
      <option value="category">category</option>
      <option value="count">count</option>
      <option value="price">price</option>
      <option value="timestamp">timestamp</option>
    </select>
  )),
}));

describe('AxesSelectPanel', () => {
  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'count',
      schema: VisFieldType.Numerical,
      column: 'count',
      validValuesCount: 100,
      uniqueValuesCount: 50,
    },
    {
      id: 2,
      name: 'price',
      schema: VisFieldType.Numerical,
      column: 'price',
      validValuesCount: 100,
      uniqueValuesCount: 60,
    },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 100,
      uniqueValuesCount: 10,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 4,
      name: 'timestamp',
      schema: VisFieldType.Date,
      column: 'timestamp',
      validValuesCount: 100,
      uniqueValuesCount: 80,
    },
  ];

  const mockUpdateVisualization = jest.fn();

  const defaultProps = {
    chartType: 'bar' as ChartType,
    numericalColumns: mockNumericalColumns,
    categoricalColumns: mockCategoricalColumns,
    dateColumns: mockDateColumns,
    currentMapping: {},
    updateVisualization: mockUpdateVisualization,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: {
        availableMappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
          },
        ],
      },
    });
  });

  it('returns null when no available mappings', () => {
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: { availableMappings: [] },
    });

    const { container } = render(<AxesSelectPanel {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls updateVisualization when valid selection is made', () => {
    mockVisualizationRegistry.findRuleByAxesMapping.mockReturnValue(ALL_VISUALIZATION_RULES[0]);

    render(<AxesSelectPanel {...defaultProps} />);

    // Select a value from the combobox and trigger onBlur
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.change(comboboxes[0], { target: { value: 'category' } });
    fireEvent.blur(comboboxes[0]);

    fireEvent.change(comboboxes[1], { target: { value: 'count' } });
    fireEvent.blur(comboboxes[1]);

    expect(mockUpdateVisualization).toHaveBeenCalled();
  });
});
