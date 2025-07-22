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
import { HttpStart, IUiSettingsClient } from '../../../core/public';

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
  let mockUiSettings: jest.Mocked<IUiSettingsClient>;
  let mockContainer: HTMLElement;
  let originalCreateElement: jest.Mock;
  let originalRender: jest.Mock;
  let originalUnmountComponentAtNode: jest.Mock;
  let dispatchEventSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create minimal mocks with only the methods needed for tests
    mockHttp = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<HttpStart>;

    mockUiSettings = ({} as unknown) as jest.Mocked<IUiSettingsClient>;

    // Create a mock container element
    mockContainer = document.createElement('div');
    mockContainer.id = BANNER_CONTAINER_ID;
    document.body.appendChild(mockContainer);

    // Store original mocked functions
    originalCreateElement = React.createElement as jest.Mock;
    originalRender = ReactDOM.render as jest.Mock;
    originalUnmountComponentAtNode = ReactDOM.unmountComponentAtNode as jest.Mock;

    // Spy on window.dispatchEvent
    dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up the DOM
    if (document.body.contains(mockContainer)) {
      document.body.removeChild(mockContainer);
    }

    // Restore spies
    dispatchEventSpy.mockRestore();
  });

  describe('renderBanner', () => {
    test('renders the GlobalBanner component with http and uiSettings clients', () => {
      renderBanner(mockHttp, mockUiSettings);

      // Check that React.createElement was called with the right arguments
      expect(originalCreateElement).toHaveBeenCalledWith(GlobalBanner, {
        http: mockHttp,
        uiSettings: mockUiSettings,
      });

      // Check that ReactDOM.render was called with the result of createElement
      expect(originalRender).toHaveBeenCalledWith(
        originalCreateElement.mock.results[0].value,
        mockContainer
      );

      // Check that window.dispatchEvent was called with a resize event
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(dispatchEventSpy.mock.calls[0][0].type).toBe('resize');
    });

    test('sets a timeout if container is not found', () => {
      // Remove the container from the DOM
      document.body.removeChild(mockContainer);

      // Spy on setTimeout
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      renderBanner(mockHttp, mockUiSettings);

      // Check that ReactDOM.render was not called
      expect(originalRender).not.toHaveBeenCalled();

      // Check that setTimeout was called
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);

      // Clean up
      setTimeoutSpy.mockRestore();
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
