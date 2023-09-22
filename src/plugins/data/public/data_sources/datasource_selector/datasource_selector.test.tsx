/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { DataSourceSelector } from './datasource_selector';

describe('DataSourceSelector', () => {
  const mockOnDataSourceChange = jest.fn();

  const sampleDataSources = [
    {
      label: 'Index patterns',
      options: [
        { label: 'sample_log1', value: 'sample_log1' },
        { label: 'sample_log2', value: 'sample_log2' },
      ],
    },
    {
      label: 'EMR',
      options: [{ label: 'EMR_cluster', value: 'EMR_cluster' }],
    },
  ];

  const selectedSource = [{ label: 'sample_log1', value: 'sample_log1' }];

  it('renders without crashing', () => {
    const { getByText } = render(
      <DataSourceSelector
        dataSourceList={sampleDataSources}
        selectedOptions={selectedSource}
        onDataSourceChange={mockOnDataSourceChange}
      />
    );

    expect(getByText('sample_log1')).toBeInTheDocument();
  });

  it('triggers onDataSourceChange when a data source is selected', () => {
    const { getByTestId, getByText } = render(
      <DataSourceSelector
        dataSourceList={sampleDataSources}
        selectedOptions={selectedSource}
        onDataSourceChange={mockOnDataSourceChange}
      />
    );

    fireEvent.click(getByTestId('comboBoxToggleListButton'));
    fireEvent.click(getByText('sample_log2'));

    expect(mockOnDataSourceChange).toHaveBeenCalledWith([
      { label: 'sample_log2', value: 'sample_log2' },
    ]);
  });

  it('has singleSelection set to true by default', () => {
    const { rerender } = render(
      <DataSourceSelector
        dataSourceList={sampleDataSources}
        selectedOptions={selectedSource}
        onDataSourceChange={mockOnDataSourceChange}
      />
    );

    let comboBox = document.querySelector('[data-test-subj="comboBoxInput"]');
    expect(comboBox).toBeInTheDocument();

    rerender(
      <DataSourceSelector
        dataSourceList={sampleDataSources}
        selectedOptions={selectedSource}
        onDataSourceChange={mockOnDataSourceChange}
        singleSelection={false}
      />
    );

    comboBox = document.querySelector('[data-test-subj="comboBoxInput"]');
    expect(comboBox).toBeInTheDocument();
  });

  it('renders all data source options', () => {
    const { getByText, getByTestId } = render(
      <DataSourceSelector
        dataSourceList={sampleDataSources}
        selectedOptions={selectedSource}
        onDataSourceChange={mockOnDataSourceChange}
      />
    );

    fireEvent.click(getByTestId('comboBoxToggleListButton'));

    expect(getByText('Index patterns')).toBeInTheDocument();
    expect(getByText('sample_log2')).toBeInTheDocument();
    expect(getByText('EMR')).toBeInTheDocument();
    expect(getByText('EMR_cluster')).toBeInTheDocument();
  });
});
