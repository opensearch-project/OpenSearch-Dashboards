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
import { createRoot } from 'react-dom/client';
import { renderBanner, unmountBanner } from './render_banner';
import { GlobalBanner } from './components/global_banner';
import { BANNER_CONTAINER_ID } from '../common';
import { HttpStart } from '../../../core/public';

// Mock React and react-dom/client
jest.mock('react', () => ({
  createElement: jest.fn(),
}));

const mockUnmount = jest.fn();
const mockRender = jest.fn();
const mockRoot = {
  render: mockRender,
  unmount: mockUnmount,
};

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => mockRoot),
}));

// Mock GlobalBanner component
jest.mock('./components/global_banner', () => ({
  GlobalBanner: jest.fn(),
}));

describe('render_banner', () => {
  let mockHttp: jest.Mocked<HttpStart>;
  let mockContainer: HTMLElement;
  let originalCreateElement: jest.Mock;

  beforeEach(() => {
    // Create minimal mocks with only the methods needed for tests
    mockHttp = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<HttpStart>;

    // Create a mock container element
    mockContainer = document.createElement('div');
    mockContainer.id = BANNER_CONTAINER_ID;
    document.body.appendChild(mockContainer);

    // Store original mocked functions
    originalCreateElement = React.createElement as jest.Mock;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up the DOM
    if (document.body.contains(mockContainer)) {
      document.body.removeChild(mockContainer);
    }
  });

  describe('renderBanner', () => {
    test('renders the GlobalBanner component with http client', () => {
      renderBanner(mockHttp);

      // Check that React.createElement was called with the right arguments
      expect(originalCreateElement).toHaveBeenCalledWith(GlobalBanner, {
        http: mockHttp,
      });

      // Check that createRoot was called with the container
      expect(createRoot).toHaveBeenCalledWith(mockContainer);

      // Check that root.render was called with the result of createElement
      expect(mockRender).toHaveBeenCalledWith(originalCreateElement.mock.results[0].value);
    });

    test('uses requestAnimationFrame if container is not found', () => {
      // Remove the container from the DOM
      document.body.removeChild(mockContainer);

      // Spy on requestAnimationFrame
      const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');

      renderBanner(mockHttp);

      // Check that createRoot was not called
      expect(createRoot).not.toHaveBeenCalled();

      // Check that requestAnimationFrame was called
      expect(requestAnimationFrameSpy).toHaveBeenCalledWith(expect.any(Function));

      // Clean up
      requestAnimationFrameSpy.mockRestore();
    });
  });

  describe('unmountBanner', () => {
    test('unmounts the component from the container', () => {
      // First render to create the root
      renderBanner(mockHttp);

      unmountBanner();

      // Check that root.unmount was called
      expect(mockUnmount).toHaveBeenCalled();
    });

    test('does nothing if container is not found', () => {
      // Remove the container from the DOM
      document.body.removeChild(mockContainer);

      unmountBanner();

      // Check that unmount was not called (because container wasn't found)
      expect(mockUnmount).not.toHaveBeenCalled();
    });
  });
});
