/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { IndexDataStructureCreator } from './index_data_structure_creator';

// Mock the child components
jest.mock('./mode_selection_row', () => ({
  ModeSelectionRow: ({ onModeChange, onPrefixChange, onIndexSelectionChange }: any) => (
    <div>
      <button data-testid="mode-change" onClick={() => onModeChange([{ value: 'prefix' }])}>
        Change Mode
      </button>
      <input
        data-testid="prefix-input"
        onChange={(e) => onPrefixChange(e)}
        placeholder="prefix input"
      />
      <button data-testid="index-select" onClick={() => onIndexSelectionChange('test-id')}>
        Select Index
      </button>
    </div>
  ),
}));

jest.mock('./matching_indices_list', () => ({
  MatchingIndicesList: ({ matchingIndices }: any) => (
    <div data-testid="matching-list">
      {matchingIndices.map((index: string) => (
        <div key={index}>{index}</div>
      ))}
    </div>
  ),
}));

const mockSelectDataStructure = jest.fn();

const defaultProps = {
  path: [
    {
      id: 'test',
      title: 'Test',
      type: 'INDEX' as const,
      children: [
        { id: 'index1', title: 'logs-2024', type: 'INDEX' as const },
        { id: 'index2', title: 'metrics-2024', type: 'INDEX' as const },
      ],
    },
  ],
  index: 0,
  selectDataStructure: mockSelectDataStructure,
  setPath: jest.fn(),
  fetchDataStructure: jest.fn(),
};

const renderComponent = (props = {}) =>
  render(
    <I18nProvider>
      <IndexDataStructureCreator {...defaultProps} {...props} />
    </I18nProvider>
  );

describe('IndexDataStructureCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without errors', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.indexDataStructureCreator')).toBeInTheDocument();
  });

  test('renders mode selection row', () => {
    const { getByText } = renderComponent();
    expect(getByText('Change Mode')).toBeInTheDocument();
  });

  test('contains expected elements', () => {
    const { getByText } = renderComponent();
    expect(getByText('Change Mode')).toBeInTheDocument();
    expect(getByText('Select Index')).toBeInTheDocument();
  });
});
