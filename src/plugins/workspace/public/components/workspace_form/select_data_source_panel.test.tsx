/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, act } from '@testing-library/react';
import { SelectDataSourcePanel, SelectDataSourcePanelProps } from './select_data_source_panel';
import { coreMock } from '../../../../../core/public/mocks';

const dataSources = [
  {
    id: 'id1',
    title: 'title1',
  },
  { id: 'id2', title: 'title2' },
];

jest.mock('../../utils', () => ({
  getDataSourcesList: jest.fn().mockResolvedValue(dataSources),
}));

const mockCoreStart = coreMock.createStart();

const setup = ({
  savedObjects = mockCoreStart.savedObjects,
  selectedDataSources = [],
  onChange = jest.fn(),
  errors = undefined,
}: Partial<SelectDataSourcePanelProps>) => {
  return render(
    <SelectDataSourcePanel
      onChange={onChange}
      savedObjects={savedObjects}
      selectedDataSources={selectedDataSources}
      errors={errors}
    />
  );
};

describe('SelectDataSourcePanel', () => {
  beforeEach(() => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight'
    );
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth'
    );
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
  });

  it('should render consistent data sources when selected data sources passed', () => {
    const { getByText } = setup({ selectedDataSources: dataSources });

    expect(getByText(dataSources[0].title)).toBeInTheDocument();
    expect(getByText(dataSources[1].title)).toBeInTheDocument();
  });

  it('should call onChange when clicking add new data source button', () => {
    const onChangeMock = jest.fn();
    const { getByTestId } = setup({ onChange: onChangeMock });

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('workspaceForm-select-dataSource-addNew'));
    expect(onChangeMock).toHaveBeenCalledWith([
      {
        id: '',
        title: '',
      },
    ]);
  });

  it('should call onChange when updating selected data sources in combo box', async () => {
    const onChangeMock = jest.fn();
    const { getByTitle, getByText } = setup({
      onChange: onChangeMock,
      selectedDataSources: [{ id: '', title: '' }],
    });
    expect(onChangeMock).not.toHaveBeenCalled();
    await act(() => {
      fireEvent.click(getByText('Select'));
    });
    fireEvent.click(getByTitle(dataSources[0].title));
    expect(onChangeMock).toHaveBeenCalledWith([{ id: 'id1', title: 'title1' }]);
  });

  it('should call onChange when deleting selected data source', async () => {
    const onChangeMock = jest.fn();
    const { getByLabelText } = setup({
      onChange: onChangeMock,
      selectedDataSources: [{ id: '', title: '' }],
    });
    expect(onChangeMock).not.toHaveBeenCalled();
    await act(() => {
      fireEvent.click(getByLabelText('Delete data source'));
    });
    expect(onChangeMock).toHaveBeenCalledWith([]);
  });
});
