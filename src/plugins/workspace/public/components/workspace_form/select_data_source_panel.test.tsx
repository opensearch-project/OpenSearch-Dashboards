/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
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

  it('should render consistent data sources when selected data sources passed', async () => {
    const { getByText } = await setup({ selectedDataSources: [] });

    expect(getByText(dataSources[0].title)).toBeInTheDocument();
    expect(getByText(dataSources[1].title)).toBeInTheDocument();
  });

  it('should call onChange when updating selected data sources in selectable', async () => {
    const onChangeMock = jest.fn();
    const { getByTitle } = await setup({
      onChange: onChangeMock,
      selectedDataSources: [],
    });
    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(getByTitle(dataSources[0].title));
    expect(onChangeMock).toHaveBeenCalledWith([{ id: 'id1', title: 'title1' }]);
  });
});
