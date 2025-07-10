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

import React, { Fragment, useEffect, useState, Suspense, useRef } from 'react';
import { EuiCallOut, EuiLoadingSpinner } from '@elastic/eui';
import { BannerConfig, DEFAULT_BANNER_HEIGHT, HIDDEN_BANNER_HEIGHT } from '../../common';
import { BannerService } from '../services/banner_service';
import { LinkRenderer } from './link_renderer';

const ReactMarkdownLazy = React.lazy(() => import('react-markdown'));

interface GlobalBannerProps {
  bannerService?: BannerService;
}

export const GlobalBanner: React.FC<GlobalBannerProps> = ({ bannerService }) => {
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  if (!bannerService) {
    throw new Error('BannerService is required');
  }

  useEffect(() => {
    const subscription = bannerService.getBannerConfig$().subscribe((config) => {
      setBannerConfig(config);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [bannerService]);

  // Update the CSS variable with the banner's height
  useEffect(() => {
    // Add a smooth transition when changing banner visibility
    document.documentElement.style.transition = 'padding-top 0.3s ease';

    // If banner is not visible, set height to 0
    if (!bannerConfig?.isVisible) {
      document.documentElement.style.setProperty('--global-banner-height', HIDDEN_BANNER_HEIGHT);

      // Reset the transition after a delay
      setTimeout(() => {
        document.documentElement.style.transition = '';
      }, 300);

      return;
    }

    // Set an initial non-zero value to ensure CSS takes effect
    document.documentElement.style.setProperty('--global-banner-height', DEFAULT_BANNER_HEIGHT);

    // Reset the transition after a delay
    setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 300);

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

      // Don't reset the height on page navigation - only when the banner is actually being hidden
      // We can detect this by checking if the banner config is still visible
      if (!bannerConfig || !bannerConfig.isVisible) {
        // Use a transition when removing the banner to prevent sudden layout shifts
        document.documentElement.style.transition = 'padding-top 0.3s ease';

        // Reset the height when banner is removed
        document.documentElement.style.setProperty('--global-banner-height', HIDDEN_BANNER_HEIGHT);

        // Reset the transition after a delay
        setTimeout(() => {
          document.documentElement.style.transition = '';
        }, 300);
      }
    };
  }, [bannerConfig]);

  // Hide banner when close button is clicked
  const hideBanner = () => {
    bannerService.updateBannerConfig({
      isVisible: false,
    });
  };

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
            renderers={{
              root: Fragment,
              link: LinkRenderer,
            }}
            source={bannerConfig.text.trim()}
          />
        </Suspense>
      );
    }

    return bannerConfig.text;
  };

  return (
    <div ref={bannerRef}>
      <EuiCallOut
        title={renderContent()}
        color={bannerConfig.color}
        iconType={bannerConfig.iconType}
        dismissible={true}
        onDismiss={hideBanner}
      />
    </div>
  );
};
