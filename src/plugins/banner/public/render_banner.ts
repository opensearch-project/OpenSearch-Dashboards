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
import { GlobalBanner } from './components/global_banner';
import { BANNER_CONTAINER_ID } from '../common';
import { HttpStart } from '../../../core/public';

/**
 * Renders the banner component into the DOM
 * @param http The HTTP client
 */
export const renderBanner = (http: HttpStart): void => {
  const container = document.getElementById(BANNER_CONTAINER_ID);

  if (container) {
    ReactDOM.render(React.createElement(GlobalBanner, { http }), container);

    // Trigger resize and reflow for proper height calculation
    window.dispatchEvent(new Event('resize'));
    void document.body.offsetHeight;
  } else {
    setTimeout(() => renderBanner(http), 50);
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
