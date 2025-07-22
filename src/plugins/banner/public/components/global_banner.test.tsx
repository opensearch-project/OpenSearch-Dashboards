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
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Subject } from 'rxjs';
import { GlobalBanner } from './global_banner';
import { BannerConfig } from '../../common';
import { coreMock } from '../../../../core/public/mocks';

// Mock ResizeObserver which is not available in JSDOM
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// Assign the mock to the global object
global.ResizeObserver = MockResizeObserver;

// Mock the ReactMarkdownLazy component
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: () => <div data-test-subj="react-markdown">Mocked Markdown</div>,
}));

describe('GlobalBanner', () => {
  let httpMock: ReturnType<typeof coreMock.createSetup>['http'];
  let uiSettingsMock: ReturnType<typeof coreMock.createStart>['uiSettings'];
  let updateSubject: Subject<{ key: string; newValue: any; oldValue: any }>;
  let wrapper: any;
  let mockBannerConfig: BannerConfig;

  beforeEach(() => {
    // Create mocks
    const coreSetup = coreMock.createSetup();
    const coreStart = coreMock.createStart();
    httpMock = coreSetup.http;
    uiSettingsMock = coreStart.uiSettings;

    // Create a subject for UI settings updates
    updateSubject = new Subject();
    uiSettingsMock.getUpdate$ = jest.fn().mockReturnValue(updateSubject);

    // Mock the HTTP get response
    mockBannerConfig = {
      content: 'Test Banner Content',
      color: 'primary',
      iconType: 'iInCircle',
      isVisible: true,
      useMarkdown: true,
      size: 'm',
    };
    httpMock.get = jest.fn().mockResolvedValue(mockBannerConfig);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  test('fetches banner config on mount', async () => {
    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Check that HTTP get was called with the correct URL
    expect(httpMock.get).toHaveBeenCalledWith('/api/_plugins/_banner/content');
    expect(httpMock.get).toHaveBeenCalledTimes(1);
  });

  test('subscribes to UI settings changes', async () => {
    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Check that getUpdate$ was called
    expect(uiSettingsMock.getUpdate$).toHaveBeenCalled();

    // Reset the HTTP get mock to track new calls
    httpMock.get.mockClear();

    // Simulate a UI settings change for a banner setting
    await act(async () => {
      updateSubject.next({
        key: 'banner:content',
        newValue: 'Updated Banner Content',
        oldValue: 'Test Banner Content',
      });
    });

    // Check that HTTP get was called again
    expect(httpMock.get).toHaveBeenCalledWith('/api/_plugins/_banner/content');
    expect(httpMock.get).toHaveBeenCalledTimes(1);
  });

  test('does not fetch when non-banner settings change', async () => {
    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Reset the HTTP get mock to track new calls
    httpMock.get.mockClear();

    // Simulate a UI settings change for a non-banner setting
    await act(async () => {
      updateSubject.next({
        key: 'theme:darkMode',
        newValue: true,
        oldValue: false,
      });
    });

    // Check that HTTP get was not called again
    expect(httpMock.get).not.toHaveBeenCalled();
  });

  test('renders loading state initially', async () => {
    // Don't resolve the HTTP get promise yet
    httpMock.get = jest.fn().mockImplementation(() => new Promise(() => {}));

    wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);

    // Check for loading spinner
    expect(wrapper.find('EuiLoadingSpinner').exists()).toBe(true);
    expect(wrapper.find('EuiCallOut').props().iconType).toBe('loading');
  });

  test('renders banner with content from API', async () => {
    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Force update to ensure the component re-renders with the new state
    wrapper.update();

    // Check that the banner is rendered with the correct props
    expect(wrapper.find('EuiCallOut').exists()).toBe(true);
    expect(wrapper.find('EuiCallOut').props().color).toBe('primary');
    expect(wrapper.find('EuiCallOut').props().iconType).toBe('iInCircle');
    expect(wrapper.find('EuiCallOut').props().size).toBe('m');
  });

  test('renders markdown content when useMarkdown is true', async () => {
    // Set useMarkdown to true
    mockBannerConfig.useMarkdown = true;
    httpMock.get = jest.fn().mockResolvedValue(mockBannerConfig);

    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Force update to ensure the component re-renders with the new state
    wrapper.update();

    // Check that Suspense is used for lazy loading
    expect(wrapper.find('Suspense').exists()).toBe(true);
  });

  test('renders plain text content when useMarkdown is false', async () => {
    // Set useMarkdown to false
    mockBannerConfig.useMarkdown = false;
    httpMock.get = jest.fn().mockResolvedValue(mockBannerConfig);

    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Force update to ensure the component re-renders with the new state
    wrapper.update();

    // Check that the content is rendered directly
    expect(wrapper.find('Suspense').exists()).toBe(false);
  });

  test('hides banner when isVisible is false', async () => {
    // Set isVisible to false
    mockBannerConfig.isVisible = false;
    httpMock.get = jest.fn().mockResolvedValue(mockBannerConfig);

    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Force update to ensure the component re-renders with the new state
    wrapper.update();

    // Check that the banner is not rendered
    expect(wrapper.find('EuiCallOut').exists()).toBe(false);
    expect(wrapper.html()).toBe(null);
  });

  test('hides banner when dismiss button is clicked', async () => {
    await act(async () => {
      wrapper = mount(<GlobalBanner http={httpMock} uiSettings={uiSettingsMock} />);
    });

    // Force update to ensure the component re-renders with the new state
    wrapper.update();

    // Check that the banner is initially rendered
    expect(wrapper.find('EuiCallOut').exists()).toBe(true);

    // Click the dismiss button
    await act(async () => {
      wrapper.find('EuiCallOut').props().onDismiss();
    });

    // Force update to ensure the component re-renders with the new state
    wrapper.update();

    // Check that the banner is no longer rendered
    expect(wrapper.find('EuiCallOut').exists()).toBe(false);
    expect(wrapper.html()).toBe(null);
  });
});
