/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
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
  assignedDataSources = [],
  onChange = jest.fn(),
  errors = undefined,
  isDashboardAdmin = true,
}: Partial<SelectDataSourcePanelProps>) => {
  return render(
    <SelectDataSourcePanel
      onChange={onChange}
      savedObjects={savedObjects}
      assignedDataSources={assignedDataSources}
      errors={errors}
      isDashboardAdmin={isDashboardAdmin}
    />
  );
};

describe('SelectDataSourcePanel', () => {
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight'
  );
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
  });

  afterEach(() => {
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetHeight',
      originalOffsetHeight as PropertyDescriptor
    );
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetWidth',
      originalOffsetWidth as PropertyDescriptor
    );
  });

  it('should click on Add data sources button', async () => {
    const { getByText } = setup({});
    expect(getByText('Add data sources')).toBeInTheDocument();

    fireEvent.click(getByText('Add data sources'));
    await waitFor(() => {
      expect(
        getByText('Add OpenSearch connections that will be available in the workspace.')
      ).toBeInTheDocument();
      expect(getByText('Close')).toBeInTheDocument();
      expect(getByText('Associate data sources')).toBeInTheDocument();
      expect(getByText(dataSources[0].title)).toBeInTheDocument();
    });
    fireEvent.click(getByText('Close'));
  });

  it('should render consistent data sources when assigned data sources passed', async () => {
    const { getByText } = setup({ assignedDataSources: [] });
    fireEvent.click(getByText('Add data sources'));
    await waitFor(() => {
      expect(getByText(dataSources[0].title)).toBeInTheDocument();
      expect(getByText(dataSources[1].title)).toBeInTheDocument();
    });
    fireEvent.click(getByText(dataSources[0].title));
    fireEvent.click(getByText(dataSources[1].title));
    await waitFor(() => {
      fireEvent.click(getByText('Associate data sources'));
      expect(getByText(dataSources[0].title)).toBeInTheDocument();
      expect(getByText(dataSources[1].title)).toBeInTheDocument();
    });
  });

  it('should call onChange when updating assigned data sources', async () => {
    const onChangeMock = jest.fn();
    const { getByTitle } = await setup({
      onChange: onChangeMock,
      assignedDataSources: [],
    });
    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(getByTitle(dataSources[0].title));
    expect(onChangeMock).toHaveBeenCalledWith([{ id: 'id1', title: 'title1' }]);
  });
});
