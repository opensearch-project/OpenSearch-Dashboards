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
import ReactDOM from 'react-dom';
import { renderBanner, unmountBanner } from './render_banner';
import { GlobalBanner } from './components/global_banner';
import { BANNER_CONTAINER_ID } from '../common';
import { HttpStart } from '../../../core/public';

// Mock React and ReactDOM
jest.mock('react', () => ({
  createElement: jest.fn(),
}));

jest.mock('react-dom', () => ({
  render: jest.fn(),
  unmountComponentAtNode: jest.fn(),
}));

// Mock GlobalBanner component
jest.mock('./components/global_banner', () => ({
  GlobalBanner: jest.fn(),
}));

describe('render_banner', () => {
  let mockHttp: jest.Mocked<HttpStart>;
  let mockContainer: HTMLElement;
  let originalCreateElement: jest.Mock;
  let originalRender: jest.Mock;
  let originalUnmountComponentAtNode: jest.Mock;

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
    originalRender = ReactDOM.render as jest.Mock;
    originalUnmountComponentAtNode = ReactDOM.unmountComponentAtNode as jest.Mock;

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

      // Check that ReactDOM.render was called with the result of createElement
      expect(originalRender).toHaveBeenCalledWith(
        originalCreateElement.mock.results[0].value,
        mockContainer
      );
    });

    test('uses requestAnimationFrame if container is not found', () => {
      // Remove the container from the DOM
      document.body.removeChild(mockContainer);

      // Spy on requestAnimationFrame
      const requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame');

      renderBanner(mockHttp);

      // Check that ReactDOM.render was not called
      expect(originalRender).not.toHaveBeenCalled();

      // Check that requestAnimationFrame was called
      expect(requestAnimationFrameSpy).toHaveBeenCalledWith(expect.any(Function));

      // Clean up
      requestAnimationFrameSpy.mockRestore();
    });
  });

  describe('unmountBanner', () => {
    test('unmounts the component from the container', () => {
      unmountBanner();

      // Check that ReactDOM.unmountComponentAtNode was called with the container
      expect(originalUnmountComponentAtNode).toHaveBeenCalledWith(mockContainer);
    });

    test('does nothing if container is not found', () => {
      // Remove the container from the DOM
      document.body.removeChild(mockContainer);

      unmountBanner();

      // Check that ReactDOM.unmountComponentAtNode was not called
      expect(originalUnmountComponentAtNode).not.toHaveBeenCalled();
    });
  });
});
