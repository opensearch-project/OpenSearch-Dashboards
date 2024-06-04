/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { IIndexPattern } from '../../../common';
import { SearchBarExtension } from './search_bar_extension';

jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiPortal: jest.fn(({ children }) => <div>{children}</div>),
  EuiErrorBoundary: jest.fn(({ children }) => <div>{children}</div>),
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
  const isEnabledMock = jest.fn();

  const defaultProps: SearchBarExtensionProps = {
    config: {
      id: 'test-extension',
      order: 1,
      isEnabled: isEnabledMock,
      getComponent: getComponentMock,
    },
    dependencies: {
      indexPatterns: [mockIndexPattern],
    },
    portalInsert: { sibling: document.createElement('div'), position: 'after' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when isEnabled is true', async () => {
    isEnabledMock.mockResolvedValue(true);
    getComponentMock.mockReturnValue(<div>Test Component</div>);

    const { getByText } = render(<SearchBarExtension {...defaultProps} />);

    await waitFor(() => {
      expect(getByText('Test Component')).toBeInTheDocument();
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

  it('calls isEnabled and getComponent correctly', async () => {
    isEnabledMock.mockResolvedValue(true);
    getComponentMock.mockReturnValue(<div>Test Component</div>);

    render(<SearchBarExtension {...defaultProps} />);

    await waitFor(() => {
      expect(isEnabledMock).toHaveBeenCalled();
    });

    expect(getComponentMock).toHaveBeenCalledWith(defaultProps.dependencies);
  });
});
