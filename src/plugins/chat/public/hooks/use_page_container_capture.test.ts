/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { usePageContainerCapture } from './use_page_container_capture';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { useObservable } from 'react-use';
import { of } from 'rxjs';

// Mock dependencies
jest.mock('../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('react-use', () => ({
  useObservable: jest.fn(),
}));

jest.mock('html2canvas-pro', () => {
  const fn = jest.fn();
  fn.setCspNonce = jest.fn();
  return fn;
});

describe('usePageContainerCapture', () => {
  let mockChat: any;
  let mockHtml2canvas: jest.Mock;
  let rafCallbacks: FrameRequestCallback[] = [];
  let rafId = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    rafCallbacks = [];
    rafId = 0;

    // Mock requestAnimationFrame and cancelAnimationFrame
    global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    global.cancelAnimationFrame = jest.fn((id: number) => {
      // Remove callback if needed
    });

    // Setup default mock for html2canvas
    mockHtml2canvas = require('html2canvas-pro');
    mockHtml2canvas.mockResolvedValue({
      toDataURL: jest.fn(() => 'data:image/jpeg;base64,mockBase64Data'),
    });

    // Setup default mock for chat service
    const div = document.createElement('div');
    const childElement = document.createElement('div');
    childElement.id = 'test-child';
    div.appendChild(childElement);

    mockChat = {
      getScreenshotFeatureEnabled$: jest.fn(() => of(true)),
      screenshotPageContainerElement: div,
    };

    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: {
        core: {
          chat: mockChat,
        },
      },
    });

    (useObservable as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePageContainerCapture());

    expect(result.current.screenshotFeatureEnabled).toBe(true);
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.capturePageContainer).toBeDefined();
    expect(typeof result.current.capturePageContainer).toBe('function');
  });

  it('should reflect screenshot feature enabled value from observable', () => {
    (useObservable as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => usePageContainerCapture());

    expect(result.current.screenshotFeatureEnabled).toBe(false);
  });

  it('should successfully capture screenshot and return correct data structure', async () => {
    const mockCanvas = {
      toDataURL: jest.fn(() => 'data:image/jpeg;base64,mockBase64EncodedString'),
    };
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const { result } = renderHook(() => usePageContainerCapture());

    let capturePromise: any;
    act(() => {
      capturePromise = result.current.capturePageContainer();
    });

    // Wait for RAF to be scheduled, then execute it
    await act(async () => {
      if (rafCallbacks.length > 0) {
        await rafCallbacks[rafCallbacks.length - 1](0);
      }
    });

    const captureResult = await capturePromise;

    expect(captureResult).toBeDefined();
    expect(captureResult).toHaveProperty('base64', 'mockBase64EncodedString');
    expect(captureResult).toHaveProperty('mimeType', 'image/jpeg');
  });

  it('should call html2canvas with correct options', async () => {
    const { result } = renderHook(() => usePageContainerCapture());

    let capturePromise: any;
    act(() => {
      capturePromise = result.current.capturePageContainer();
    });

    // Wait for RAF to be scheduled, then execute it
    await act(async () => {
      if (rafCallbacks.length > 0) {
        await rafCallbacks[rafCallbacks.length - 1](0);
      }
    });

    await capturePromise;

    expect(mockHtml2canvas).toHaveBeenCalledWith(
      mockChat.screenshotPageContainerElement.childNodes[0],
      {
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      }
    );
  });

  it('should handle errors gracefully and return null', async () => {
    mockChat.screenshotPageContainerElement = null;

    const { result } = renderHook(() => usePageContainerCapture());

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    let capturePromise: any;
    act(() => {
      capturePromise = result.current.capturePageContainer();
    });

    // Wait for RAF to be scheduled, then execute it
    await act(async () => {
      if (rafCallbacks.length > 0) {
        await rafCallbacks[rafCallbacks.length - 1](0);
      }
    });

    const captureResult = await capturePromise;

    expect(captureResult).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to capture screenshot:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should prevent concurrent captures', async () => {
    let resolveCapture: any;
    const capturePromise = new Promise((resolve) => {
      resolveCapture = resolve;
    });

    mockHtml2canvas.mockImplementation(async () => {
      await capturePromise;
      return {
        toDataURL: jest.fn(() => 'data:image/jpeg;base64,mockBase64Data'),
      };
    });

    const { result } = renderHook(() => usePageContainerCapture());

    let firstCapturePromise: any;
    act(() => {
      // Start first capture
      firstCapturePromise = result.current.capturePageContainer();
    });

    // isCapturing should now be true, so second call should return early
    const secondCaptureResult = await result.current.capturePageContainer();

    // Second capture should return undefined (early return)
    expect(secondCaptureResult).toBeUndefined();

    // Resolve the first capture
    resolveCapture();
    await act(async () => {
      if (rafCallbacks.length > 0) {
        await rafCallbacks[rafCallbacks.length - 1](0);
      }
    });

    await firstCapturePromise;
  });

  it('should reset isCapturing state after capture completes', async () => {
    const { result } = renderHook(() => usePageContainerCapture());

    expect(result.current.isCapturing).toBe(false);

    let capturePromise: any;
    act(() => {
      capturePromise = result.current.capturePageContainer();
    });

    // Wait for RAF to be scheduled, then execute it
    await act(async () => {
      if (rafCallbacks.length > 0) {
        await rafCallbacks[rafCallbacks.length - 1](0);
      }
    });

    await capturePromise;

    expect(result.current.isCapturing).toBe(false);
  });

  it('should return base64 string without data URL prefix', async () => {
    const mockBase64 = 'a'.repeat(100);
    const mockCanvas = {
      toDataURL: jest.fn(() => `data:image/jpeg;base64,${mockBase64}`),
    };
    mockHtml2canvas.mockResolvedValue(mockCanvas);

    const { result } = renderHook(() => usePageContainerCapture());

    let capturePromise: any;
    act(() => {
      capturePromise = result.current.capturePageContainer();
    });

    // Wait for RAF to be scheduled, then execute it
    await act(async () => {
      if (rafCallbacks.length > 0) {
        await rafCallbacks[rafCallbacks.length - 1](0);
      }
    });

    const captureResult = await capturePromise;

    expect(captureResult).toBeDefined();
    expect(captureResult.base64).toBe(mockBase64);
    expect(captureResult.mimeType).toBe('image/jpeg');
  });
});
