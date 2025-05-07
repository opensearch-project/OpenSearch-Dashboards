/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { ExploreStartPlugins } from './types';
import { ExploreApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation }: ExploreStartPlugins,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <ExploreApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
