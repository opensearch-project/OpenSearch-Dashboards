/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderApp } from './landing_page_application';
import { navigationPluginMock } from '../../navigation/public/mocks';
import { coreMock } from '../../../../src/core/public/mocks';

describe('Landing page application', () => {
  it('renders and unmount without crashing', () => {
    expect(() => {
      const unmountFn = renderApp({
        mountElement: document.createElement('div'),
        props: {
          navigateToApp: jest.fn(),
          navLinks: [],
          navigationUI: navigationPluginMock.createStartContract().ui,
          setAppDescriptionControls: coreMock.createStart().application.setAppDescriptionControls,
          pageDescription: '',
        },
      });

      unmountFn();
    }).not.toThrow();
  });
});
