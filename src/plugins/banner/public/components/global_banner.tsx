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

import React, { Fragment, useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { EuiCallOut, EuiLoadingSpinner } from '@elastic/eui';
import { BannerConfig, HIDDEN_BANNER_HEIGHT, DEFAULT_BANNER_CONFIG } from '../../common';
import { LinkRenderer } from './link_renderer';
import { HttpStart } from '../../../../core/public';

const ReactMarkdownLazy = React.lazy(() => import('react-markdown'));

interface GlobalBannerProps {
  http: HttpStart;
}

// Key for storing banner hidden state in sessionStorage
const BANNER_HIDDEN_KEY = 'bannerHidden';

export const GlobalBanner: React.FC<GlobalBannerProps> = ({ http }) => {
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Check if banner is hidden in sessionStorage
  const isBannerHidden = useCallback(() => {
    try {
      return sessionStorage.getItem(BANNER_HIDDEN_KEY) === 'true';
    } catch (e) {
      // If sessionStorage is not available, return false
      return false;
    }
  }, []);

  // Fetch banner config from API when component mounts
  const fetchBannerConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await http.get<BannerConfig>('/api/_plugins/_banner/content');

      // Apply cached hidden state if applicable
      if (isBannerHidden()) {
        setBannerConfig({
          ...response,
          isVisible: false,
        });
      } else {
        setBannerConfig(response);
      }
    } catch (error) {
      // Hide banner on error
      setBannerConfig({
        ...DEFAULT_BANNER_CONFIG,
      });
    } finally {
      setIsLoading(false);
    }
  }, [http, isBannerHidden]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchBannerConfig();
  }, [http, fetchBannerConfig]);

  // Update the CSS variable with the banner's height
  useEffect(() => {
    // No transition needed

    // If banner is not visible, set height to 0
    if (!bannerConfig?.isVisible) {
      document.documentElement.style.setProperty('--global-banner-height', HIDDEN_BANNER_HEIGHT);

      return;
    }

    // Use ResizeObserver to detect height changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get height from ResizeObserver
        const height = entry.contentRect.height;

        // Set the CSS variable with the banner height
        document.documentElement.style.setProperty('--global-banner-height', `${height}px`);
      }
    });

    if (bannerRef.current) {
      resizeObserver.observe(bannerRef.current);

      // Also set the height directly for immediate effect
      const height = bannerRef.current.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--global-banner-height', `${height}px`);
    }

    return () => {
      resizeObserver.disconnect();

      if (!bannerConfig || !bannerConfig.isVisible) {
        // Reset the height when banner is removed
        document.documentElement.style.setProperty('--global-banner-height', HIDDEN_BANNER_HEIGHT);
      }
    };
  }, [bannerConfig]);

  // Hide banner when close button is clicked
  const hideBanner = useCallback(() => {
    // Update the state - this ensures the banner is hidden in the current session
    setBannerConfig((prevConfig) => (prevConfig ? { ...prevConfig, isVisible: false } : null));

    // Store the hidden state in sessionStorage
    try {
      sessionStorage.setItem(BANNER_HIDDEN_KEY, 'true');
    } catch (e) {
      // Intentionally empty - state is already updated above so banner will still be hidden
    }
  }, []);

  if (isLoading) {
    return (
      <div ref={bannerRef}>
        <EuiCallOut iconType="loading">
          <EuiLoadingSpinner size="m" /> Loading banner...
        </EuiCallOut>
      </div>
    );
  }

  if (!bannerConfig || !bannerConfig.isVisible) {
    return null;
  }

  const renderContent = () => {
    if (bannerConfig.useMarkdown) {
      return (
        <Suspense
          fallback={
            <div>
              <EuiLoadingSpinner />
            </div>
          }
        >
          <ReactMarkdownLazy
            // @ts-expect-error TS2322 TODO(ts-error): fixme
            renderers={{
              root: Fragment,
              link: LinkRenderer,
            }}
            source={bannerConfig.content.trim()}
          />
        </Suspense>
      );
    }

    return bannerConfig.content;
  };

  return (
    <div ref={bannerRef}>
      <EuiCallOut
        title={renderContent()}
        color={bannerConfig.color}
        iconType={bannerConfig.iconType}
        dismissible={true}
        onDismiss={hideBanner}
        size={bannerConfig.size}
      />
    </div>
  );
};
