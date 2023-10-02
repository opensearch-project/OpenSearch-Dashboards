/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPage, EuiPageBody } from '@elastic/eui';
import { Suspense } from 'react';
import { AppMountParameters } from '../../../../core/public';
import { Sidebar } from './sidebar';
import { NoView } from './no_view';
import { View } from '../services/view_service/view';
import './app_container.scss';

export const AppContainer = ({ view, params }: { view?: View; params: AppMountParameters }) => {
  // TODO: Make this more robust.
  if (!view) {
    return <NoView />;
  }

  const { Canvas, Panel, Context } = view;

  // Render the application DOM.
  return (
    <EuiPage className="deLayout" paddingSize="none">
      {/* TODO: improve fallback state */}
      <Suspense fallback={<div>Loading...</div>}>
        <Context {...params}>
          <Sidebar>
            <Panel {...params} />
          </Sidebar>
          <EuiPageBody className="deLayout__canvas">
            <Canvas {...params} />
          </EuiPageBody>
        </Context>
      </Suspense>
    </EuiPage>
  );
};
