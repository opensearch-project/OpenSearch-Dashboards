/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { IIndexPattern } from '../../../common';
import { SearchBarExtension } from './search_bar_extension';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: jest.fn((element) => element),
}));

type SearchBarExtensionProps = ComponentProps<typeof SearchBarExtension>;

const mockIndexPattern = {
  id: '1234',
  title: 'logstash-*',
  fields: [
    {
      name: 'response',
      type: 'number',
      esTypes: ['integer'],
      aggregatable: true,
      filterable: true,
      searchable: true,
    },
  ],
} as IIndexPattern;

describe('SearchBarExtension', () => {
  const getComponentMock = jest.fn();
  const getBannerMock = jest.fn();
  const isEnabledMock = jest.fn();

  const defaultProps: SearchBarExtensionProps = {
    config: {
      id: 'test-extension',
      order: 1,
      isEnabled: isEnabledMock,
      getComponent: getComponentMock,
      getBanner: getBannerMock,
    },
    dependencies: {
      indexPatterns: [mockIndexPattern],
      language: 'Test',
    },
    componentContainer: document.createElement('div'),
    bannerContainer: document.createElement('div'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when isEnabled is true', async () => {
    isEnabledMock.mockResolvedValue(true);
    getComponentMock.mockReturnValue(<div>Test Component</div>);
    getBannerMock.mockReturnValue(<div>Test Banner</div>);

    const { getByText } = render(<SearchBarExtension {...defaultProps} />);

    await waitFor(() => {
      expect(getByText('Test Component')).toBeInTheDocument();
      expect(getByText('Test Banner')).toBeInTheDocument();
    });

    expect(isEnabledMock).toHaveBeenCalled();
    expect(getComponentMock).toHaveBeenCalledWith(defaultProps.dependencies);
  });

  it('does not render when isEnabled is false', async () => {
    isEnabledMock.mockResolvedValue(false);
    getComponentMock.mockReturnValue(<div>Test Component</div>);

    const { queryByText } = render(<SearchBarExtension {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText('Test Component')).toBeNull();
    });

    expect(isEnabledMock).toHaveBeenCalled();
  });
});
