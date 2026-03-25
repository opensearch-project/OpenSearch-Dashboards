/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act } from 'react';
import { renderHook } from '@testing-library/react';
import {
  usePageContainerCapture,
  calculateScale,
  MAX_DIMENSION,
} from './use_page_container_capture';
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
      screenshot: {
        getEnabled$: jest.fn(() => of(true)),
        getPageContainerElement: jest.fn(() => div),
      },
      screenshotPageContainerElement: div, // Keep for backward compatibility
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

    const containerElement = mockChat.screenshot.getPageContainerElement();
    expect(mockHtml2canvas).toHaveBeenCalledWith(containerElement.childNodes[0], {
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      scale: 1,
    });
  });

  it('should handle errors gracefully and return null', async () => {
    mockChat.screenshot.getPageContainerElement = jest.fn(() => null);

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

describe('calculateScale', () => {
  it('should return 1 when both dimensions are under MAX_DIMENSION', () => {
    expect(calculateScale(1000, 2000)).toBe(1);
    expect(calculateScale(7999, 7999)).toBe(1);
    expect(calculateScale(100, 100)).toBe(1);
  });

  it('should return 1 when dimensions are exactly MAX_DIMENSION', () => {
    expect(calculateScale(MAX_DIMENSION, MAX_DIMENSION)).toBe(1);
    expect(calculateScale(MAX_DIMENSION, 1000)).toBe(1);
    expect(calculateScale(1000, MAX_DIMENSION)).toBe(1);
  });

  it('should scale down when width exceeds MAX_DIMENSION', () => {
    const scale = calculateScale(16000, 4000);
    expect(scale).toBeLessThan(1);
    expect(16000 * scale).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(4000 * scale).toBeLessThanOrEqual(MAX_DIMENSION);
  });

  it('should scale down when height exceeds MAX_DIMENSION', () => {
    const scale = calculateScale(4000, 16000);
    expect(scale).toBeLessThan(1);
    expect(4000 * scale).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(16000 * scale).toBeLessThanOrEqual(MAX_DIMENSION);
  });

  it('should scale down when both dimensions exceed MAX_DIMENSION', () => {
    const scale = calculateScale(10000, 12000);
    expect(scale).toBeLessThan(1);
    expect(10000 * scale).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(12000 * scale).toBeLessThanOrEqual(MAX_DIMENSION);
  });

  it('should use the smaller scale factor when both dimensions exceed MAX_DIMENSION', () => {
    // Height is larger, so scaleY should be smaller and used
    const scale = calculateScale(10000, 20000);
    expect(scale).toBe(Math.floor((MAX_DIMENSION / 20000) * 1e10) / 1e10);
  });

  it('should floor to 10 decimal places to ensure dimensions stay under 8k', () => {
    // Test with a dimension that would produce a repeating decimal
    const scale = calculateScale(10001, 5000);
    const scaledWidth = 10001 * scale;
    expect(scaledWidth).toBeLessThanOrEqual(MAX_DIMENSION);
  });

  it('should handle very large dimensions', () => {
    const scale = calculateScale(100000, 100000);
    expect(scale).toBeLessThan(1);
    expect(100000 * scale).toBeLessThanOrEqual(MAX_DIMENSION);
  });

  it('should ensure resulting dimensions never exceed MAX_DIMENSION due to floating point', () => {
    // Test edge cases where floating point could cause issues
    const testCases = [
      [8001, 8001],
      [9999, 7000],
      [12345, 8765],
      [16384, 16384],
      [32000, 24000],
    ];

    testCases.forEach(([width, height]) => {
      const scale = calculateScale(width, height);
      expect(width * scale).toBeLessThanOrEqual(MAX_DIMENSION);
      expect(height * scale).toBeLessThanOrEqual(MAX_DIMENSION);
    });
  });
});
