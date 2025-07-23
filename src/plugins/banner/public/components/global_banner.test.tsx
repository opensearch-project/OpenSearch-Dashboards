/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { GlobalBanner } from './global_banner';
import { httpServiceMock } from '../../../../core/public/mocks';

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

// Mock React.lazy and Suspense
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    lazy: jest.fn().mockImplementation(() => () => <div>Mocked Markdown Content</div>),
    Suspense: ({ children, fallback }: any) => children,
  };
});

// Mock react-markdown
jest.mock('react-markdown', () => () => <div>Mocked Markdown Content</div>);

describe('<GlobalBanner />', () => {
  let mockHttp: ReturnType<typeof httpServiceMock.createStartContract>;
  let originalResizeObserver: typeof window.ResizeObserver;
  let mockSetProperty: jest.SpyInstance;

  beforeEach(() => {
    mockHttp = httpServiceMock.createStartContract();

    // Mock successful API response
    mockHttp.get.mockResolvedValue({
      content: 'Test Banner Content',
      color: 'primary',
      iconType: 'iInCircle',
      isVisible: true,
      useMarkdown: false,
      size: 'm',
    });

    // Save original ResizeObserver
    originalResizeObserver = window.ResizeObserver;

    // Mock ResizeObserver
    window.ResizeObserver = MockResizeObserver as any;

    // Mock document.documentElement.style.setProperty
    mockSetProperty = jest.spyOn(document.documentElement.style, 'setProperty');
  });

  afterEach(() => {
    // Restore original ResizeObserver
    window.ResizeObserver = originalResizeObserver;

    // Restore mocks
    mockSetProperty.mockRestore();
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    const { getByText } = render(<GlobalBanner http={mockHttp} />);

    expect(getByText('Loading banner...')).toBeInTheDocument();
  });

  test('renders banner with content from API', async () => {
    const { getByText } = render(<GlobalBanner http={mockHttp} />);

    // Wait for API call to resolve
    await waitFor(() => {
      expect(mockHttp.get).toHaveBeenCalledWith('/api/_plugins/_banner/content');
      expect(getByText('Test Banner Content')).toBeInTheDocument();
    });
  });

  test('sets CSS variable with banner height', async () => {
    // Mock getBoundingClientRect
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn().mockReturnValue({ height: 50 });

    render(<GlobalBanner http={mockHttp} />);

    // Wait for API call to resolve
    await waitFor(() => {
      expect(mockHttp.get).toHaveBeenCalled();
      expect(mockSetProperty).toHaveBeenCalledWith('--global-banner-height', '50px');
    });

    // Restore original getBoundingClientRect
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  test('renders markdown content when useMarkdown is true', async () => {
    // Mock API response with useMarkdown: true
    mockHttp.get.mockResolvedValue({
      content: '**Test** _Markdown_',
      color: 'primary',
      iconType: 'iInCircle',
      isVisible: true,
      useMarkdown: true,
      size: 'm',
    });

    const { getByText } = render(<GlobalBanner http={mockHttp} />);

    // Wait for API call to resolve
    await waitFor(() => {
      expect(mockHttp.get).toHaveBeenCalled();
      expect(getByText('Mocked Markdown Content')).toBeInTheDocument();
    });
  });

  test('hides banner when API call fails', async () => {
    // Mock API failure
    mockHttp.get.mockRejectedValue(new Error('API Error'));

    const { queryByText } = render(<GlobalBanner http={mockHttp} />);

    // Wait for API call to reject
    await waitFor(() => {
      expect(mockHttp.get).toHaveBeenCalled();
      expect(queryByText('Loading banner...')).not.toBeInTheDocument();
      expect(queryByText('Test Banner Content')).not.toBeInTheDocument();
      expect(mockSetProperty).toHaveBeenCalledWith('--global-banner-height', '0px');
    });
  });

  test('hides banner when close button is clicked', async () => {
    const { getByTestId } = render(<GlobalBanner http={mockHttp} />);

    // Wait for API call to resolve
    await waitFor(() => {
      expect(mockHttp.get).toHaveBeenCalled();
    });

    // Click the close button
    act(() => {
      getByTestId('closeCallOutButton').click();
    });

    // Verify banner is hidden
    expect(mockSetProperty).toHaveBeenCalledWith('--global-banner-height', '0px');
  });

  test('renders nothing when isVisible is false', async () => {
    // Mock API response with isVisible: false
    mockHttp.get.mockResolvedValue({
      content: 'Test Banner Content',
      color: 'primary',
      iconType: 'iInCircle',
      isVisible: false,
      useMarkdown: false,
      size: 'm',
    });

    const { queryByText } = render(<GlobalBanner http={mockHttp} />);

    // Wait for API call to resolve
    await waitFor(() => {
      expect(mockHttp.get).toHaveBeenCalled();
      expect(queryByText('Loading banner...')).not.toBeInTheDocument();
      expect(queryByText('Test Banner Content')).not.toBeInTheDocument();
      expect(mockSetProperty).toHaveBeenCalledWith('--global-banner-height', '0px');
    });
  });
});
