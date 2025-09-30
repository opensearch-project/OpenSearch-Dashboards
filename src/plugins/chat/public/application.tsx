/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { AppPluginStartDependencies } from './types';
import { ChatApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation, charts }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <ChatApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
      charts={charts}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
