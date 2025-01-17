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

const mockQuery = {
  query: 'dummy query',
  language: 'kuery',
  dataset: {
    id: 'db',
    title: 'db',
    type: 'index',
    dataSource: { id: 'testId', type: 'DATA_SOURCE', title: 'testTitle' },
  },
};

describe('QueryEditorExtension', () => {
  const getComponentMock = jest.fn();
  const getBannerMock = jest.fn();
  const getBottomPanelMock = jest.fn();
  const isEnabledMock = jest.fn();

  const defaultProps: QueryEditorExtensionProps = {
    config: {
      id: 'test-extension',
      order: 1,
      isEnabled$: isEnabledMock,
      getComponent: getComponentMock,
      getBanner: getBannerMock,
      getBottomPanel: getBottomPanelMock,
    },
    dependencies: {
      language: 'Test',
      onSelectLanguage: jest.fn(),
      isCollapsed: false,
      setIsCollapsed: jest.fn(),
      query: mockQuery,
    },
    componentContainer: document.createElement('div'),
    bannerContainer: document.createElement('div'),
    bottomPanelContainer: document.createElement('div'),
    queryControlsContainer: document.createElement('div'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when isEnabled is true', async () => {
    isEnabledMock.mockReturnValue(of(true));
    getComponentMock.mockReturnValue(<div>Test Component</div>);
    getBannerMock.mockReturnValue(<div>Test Banner</div>);
    getBottomPanelMock.mockReturnValue(<div>Test Bottom panel</div>);

    const { getByText } = render(<QueryEditorExtension {...defaultProps} />);

    await waitFor(() => {
      expect(getByText('Test Component')).toBeInTheDocument();
      expect(getByText('Test Banner')).toBeInTheDocument();
      expect(getByText('Test Bottom panel')).toBeInTheDocument();
    });

    expect(isEnabledMock).toHaveBeenCalled();
    expect(getComponentMock).toHaveBeenCalledWith(defaultProps.dependencies);
    expect(getBottomPanelMock).toHaveBeenCalledWith(defaultProps.dependencies);
  });

  it('does not render when isEnabled is false', async () => {
    isEnabledMock.mockReturnValue(of(false));
    getComponentMock.mockReturnValue(<div>Test Component</div>);
    getBottomPanelMock.mockReturnValue(<div>Test Bottom panel</div>);

    const { queryByText } = render(<QueryEditorExtension {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText('Test Component')).toBeNull();
      expect(queryByText('Test Bottom panel')).toBeNull();
    });

    expect(isEnabledMock).toHaveBeenCalled();
  });
});
