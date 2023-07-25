/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPage, EuiPageBody } from '@elastic/eui';
import { Suspense } from 'react';
import { AppMountParameters } from '../../../../core/public';
import { Sidebar } from './sidebar';
import { NoView } from './no_view';
import { View } from '../services/view_service/view';
import './app_container.scss';

export const AppContainer = ({ view, params }: { view?: View; params: AppMountParameters }) => {
  // To support redirects, we need to store the redirect state in a stateful component.
  const [redirectState] = useState(() => {
    return params.history.location.state;
  });

  // TODO: Make this more robust.
  if (!view) {
    return <NoView />;
  }

  const viewParams = {
    ...params,
    redirectState,
  };

  const { Canvas, Panel } = view;

  // Render the application DOM.
  return (
    <EuiPage className="dePage eui-fullHeight" paddingSize="none">
      {/* TODO: improve loading state */}
      <Suspense fallback={<div>Loading...</div>}>
        <Sidebar>
          <Panel {...viewParams} />
        </Sidebar>
        <EuiPageBody>
          <Canvas {...viewParams} />
        </EuiPageBody>
      </Suspense>
    </EuiPage>
  );
};
