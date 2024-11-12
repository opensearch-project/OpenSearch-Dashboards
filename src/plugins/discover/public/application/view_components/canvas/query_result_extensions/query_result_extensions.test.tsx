/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryResultExtensions, QueryResultExtensionsProps } from './query_result_extensions';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: jest.fn((element) => element),
}));

describe('QueryResultExtension', () => {
  const getBannerMock = jest.fn();

  const defaultProps: QueryResultExtensionsProps = {
    configMap: {
      'test-extension': {
        id: 'test-extension',
        order: 1,
        getBanner: getBannerMock,
      },
    },
    dependencies: {
      query: {
        query: '',
        language: '',
        dataset: {
          id: '',
          title: '',
          type: 'DATA_SOURCE',
        },
      },
      queryStatus: 'loading',
    },
    bannerContainer: document.createElement('div'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when config map is defined', async () => {
    getBannerMock.mockReturnValue(<div>Test Banner</div>);

    const { getByText } = render(<QueryResultExtensions {...defaultProps} />);

    await waitFor(() => {
      expect(getByText('Test Banner')).toBeInTheDocument();
    });

    expect(getBannerMock).toHaveBeenCalledWith(defaultProps.dependencies);
  });

  it('does not render when empty banner is returned from the config', async () => {
    getBannerMock.mockReturnValue(null);

    const { queryByText } = render(<QueryResultExtensions {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText('Test Banner')).toBeNull();
    });
  });

  it('does not render when config map is empty', async () => {
    delete defaultProps.configMap;
    const { queryByText } = render(<QueryResultExtensions {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText('Test Banner')).toBeNull();
    });
  });

  it('respects the render order when config entries are present', async () => {
    defaultProps.configMap = {
      'test-banner-1': {
        id: 'test-banner-1',
        order: 1,
        getBanner: jest.fn().mockReturnValue(<div>first</div>),
      },
      'test-banner-2': {
        id: 'test-banner-2',
        order: 2,
        getBanner: jest.fn().mockReturnValue(<div>second</div>),
      },
    };
    const { getByText } = render(<QueryResultExtensions {...defaultProps} />);

    await waitFor(() => {
      const firstBanner = getByText('first');
      const secondBanner = getByText('second');
      expect(firstBanner.compareDocumentPosition(secondBanner)).toBe(4);
    });
  });
});
