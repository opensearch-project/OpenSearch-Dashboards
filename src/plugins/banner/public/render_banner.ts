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
import { createRoot, Root } from 'react-dom/client';
import { GlobalBanner } from './components/global_banner';
import { BANNER_CONTAINER_ID } from '../common';
import { HttpStart } from '../../../core/public';

let root: Root | null = null;

/**
 * Renders the banner component into the DOM
 * @param http The HTTP client
 */
export const renderBanner = (http: HttpStart): void => {
  const container = document.getElementById(BANNER_CONTAINER_ID);

  if (container) {
    if (!root) {
      root = createRoot(container);
    }
    root.render(React.createElement(GlobalBanner, { http }));
  } else {
    // Use requestAnimationFrame to wait for the next paint cycle
    requestAnimationFrame(() => renderBanner(http));
  }
};

/**
 * Unmounts the banner component from the DOM
 */
export const unmountBanner = (): void => {
  if (root) {
    root.unmount();
    root = null;
  }
};
