/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderApp } from './landing_page_application';

describe('Landing page application', () => {
  it('renders and unmount without crashing', () => {
    expect(() => {
      const unmountFn = renderApp({
        mountElement: document.createElement('div'),
        props: {
          navigateToApp: jest.fn(),
          navLinks: [],
        },
      });

      unmountFn();
    }).not.toThrow();
  });
});
