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
import { BannerService } from './banner_service';
import { GlobalBanner } from '../components/global_banner';
import { BANNER_CONTAINER_ID, DEFAULT_BANNER_HEIGHT, HIDDEN_BANNER_HEIGHT } from '../../common';

/**
 * Sets the initial banner height based on visibility
 * @param isVisible Whether the banner is initially visible
 */
export const setInitialBannerHeight = (isVisible: boolean): void => {
  const initialHeight = isVisible ? DEFAULT_BANNER_HEIGHT : HIDDEN_BANNER_HEIGHT;
  document.documentElement.style.setProperty('--global-banner-height', initialHeight);
};

/**
 * Renders the banner component into the DOM
 * @param bannerService The banner service instance
 */
export const renderBanner = (bannerService: BannerService): void => {
  const container = document.getElementById(BANNER_CONTAINER_ID);

  if (container) {
    ReactDOM.render(React.createElement(GlobalBanner, { bannerService }), container);

    // Trigger resize and reflow for proper height calculation
    window.dispatchEvent(new Event('resize'));
    void document.body.offsetHeight;
  } else {
    setTimeout(() => renderBanner(bannerService), 50);
  }
};

/**
 * Unmounts the banner component from the DOM
 */
export const unmountBanner = (): void => {
  const container = document.getElementById(BANNER_CONTAINER_ID);
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
  }
};
