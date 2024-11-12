/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryResultExtension, QueryResultExtensionProps } from './query_result_extension';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: jest.fn((element) => element),
}));

describe('QueryResultExtension', () => {
  const getBannerMock = jest.fn();

  const defaultProps: QueryResultExtensionProps = {
    config: {
      id: 'test-extension',
      order: 1,
      getBanner: getBannerMock,
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

  it('renders correctly when valid banner is passed', async () => {
    getBannerMock.mockReturnValue(<div>Test Banner</div>);

    const { getByText } = render(<QueryResultExtension {...defaultProps} />);

    await waitFor(() => {
      expect(getByText('Test Banner')).toBeInTheDocument();
    });

    expect(getBannerMock).toHaveBeenCalledWith(defaultProps.dependencies);
  });

  it('does not render when banner is not present', async () => {
    getBannerMock.mockReturnValue(null);

    const { queryByText } = render(<QueryResultExtension {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText('Test Banner')).toBeNull();
    });
  });
});
