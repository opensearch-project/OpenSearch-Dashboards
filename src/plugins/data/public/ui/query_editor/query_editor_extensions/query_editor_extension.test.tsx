/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, waitFor } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { of } from 'rxjs';
import { QueryEditorExtension } from './query_editor_extension';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: jest.fn((element) => element),
}));

type QueryEditorExtensionProps = ComponentProps<typeof QueryEditorExtension>;

describe('QueryEditorExtension', () => {
  const getComponentMock = jest.fn();
  const getBannerMock = jest.fn();
  const isEnabledMock = jest.fn();

  const defaultProps: QueryEditorExtensionProps = {
    config: {
      id: 'test-extension',
      order: 1,
      isEnabled$: isEnabledMock,
      getComponent: getComponentMock,
      getBanner: getBannerMock,
    },
    dependencies: {
      language: 'Test',
      onSelectLanguage: jest.fn(),
      isCollapsed: false,
      setIsCollapsed: jest.fn(),
    },
    componentContainer: document.createElement('div'),
    bannerContainer: document.createElement('div'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when isEnabled is true', async () => {
    isEnabledMock.mockReturnValue(of(true));
    getComponentMock.mockReturnValue(<div>Test Component</div>);
    getBannerMock.mockReturnValue(<div>Test Banner</div>);

    const { getByText } = render(<QueryEditorExtension {...defaultProps} />);

    await waitFor(() => {
      expect(getByText('Test Component')).toBeInTheDocument();
      expect(getByText('Test Banner')).toBeInTheDocument();
    });

    expect(isEnabledMock).toHaveBeenCalled();
    expect(getComponentMock).toHaveBeenCalledWith(defaultProps.dependencies);
  });

  it('does not render when isEnabled is false', async () => {
    isEnabledMock.mockReturnValue(of(false));
    getComponentMock.mockReturnValue(<div>Test Component</div>);

    const { queryByText } = render(<QueryEditorExtension {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText('Test Component')).toBeNull();
    });

    expect(isEnabledMock).toHaveBeenCalled();
  });
});
