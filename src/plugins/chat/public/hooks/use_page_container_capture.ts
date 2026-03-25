/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { useObservable } from 'react-use';
import { of } from 'rxjs';

import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';

export interface PageContainerImageData {
  mimeType: string;
  base64: string;
}

export const MAX_DIMENSION = 8000;

/**
 * Calculates the scale factor to ensure both width and height stay under MAX_DIMENSION.
 * The scale is floored to 10 decimal places to guarantee dimensions stay under the limit.
 */
export const calculateScale = (width: number, height: number): number => {
  const scaleX = width > MAX_DIMENSION ? MAX_DIMENSION / width : 1;
  const scaleY = height > MAX_DIMENSION ? MAX_DIMENSION / height : 1;
  return Math.floor(Math.min(scaleX, scaleY) * 1e10) / 1e10;
};

export const usePageContainerCapture = () => {
  const {
    services: {
      core: { chat },
    },
  } = useOpenSearchDashboards<{ core: CoreStart }>();
  const chatScreenshotObservable$ = useMemo(() => {
    if (chat?.screenshot?.getEnabled$) {
      return chat.screenshot.getEnabled$();
    }
    return of(false);
  }, [chat]);
  const screenshotFeatureEnabled = useObservable(chatScreenshotObservable$, false);
  const [isCapturing, setIsCapturing] = useState(false);
  const resolverRef = useRef<
    (image: PageContainerImageData | PromiseLike<PageContainerImageData>) => void
  >();
  const rejecterRef = useRef<Function>();

  const capturePageContainer = useCallback(async () => {
    if (isCapturing) {
      return;
    }
    setIsCapturing(true);
    try {
      return await new Promise<PageContainerImageData>((resolve, reject) => {
        resolverRef.current = resolve;
        rejecterRef.current = reject;
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to capture screenshot:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  useEffect(() => {
    if (!isCapturing) {
      return;
    }
    let canceled = false;
    const rafId = window.requestAnimationFrame(async () => {
      const screenshotPageContainerElement = chat.screenshot?.getPageContainerElement();
      if (!screenshotPageContainerElement) {
        rejecterRef.current?.(new Error('chat.screenshot.getPageContainerElement() returned null'));
        return;
      }
      // Access child nodes to get the latest changes
      const element = screenshotPageContainerElement.childNodes[0];
      try {
        const mimeType = 'image/jpeg';
        const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
        if (nonce) {
          html2canvas.setCspNonce(nonce);
        }
        // Limit both width and height to 8000 pixels
        const elementWidth = (element as HTMLElement).scrollWidth;
        const elementHeight = (element as HTMLElement).scrollHeight;
        const scale = calculateScale(elementWidth, elementHeight);

        const canvas = await html2canvas(element as HTMLElement, {
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          scale,
        });

        if (canceled) {
          return;
        }

        const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
        resolverRef.current?.({
          base64,
          mimeType,
        });
      } catch (err) {
        if (canceled) {
          return;
        }
        rejecterRef.current?.(err);
      } finally {
        resolverRef.current = undefined;
        rejecterRef.current = undefined;
      }
    });
    return () => {
      canceled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [isCapturing, chat]);

  return {
    screenshotFeatureEnabled,
    isCapturing,
    capturePageContainer,
  };
};
