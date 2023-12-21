/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPage, EuiPageBody, EuiResizableContainer } from '@elastic/eui';
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
          <EuiResizableContainer>
            {(EuiResizablePanel, EuiResizableButton) => (
              <>
                <EuiResizablePanel initialSize={140} minSize="10%" mode="collapsible">
                  <Sidebar>
                    <Panel {...params} />
                  </Sidebar>
                </EuiResizablePanel>
                <EuiResizableButton />

                <EuiResizablePanel initialSize={1140} minSize="65%" mode="main">
                  <EuiPageBody className="deLayout__canvas">
                    <Canvas {...params} />
                  </EuiPageBody>
                </EuiResizablePanel>
              </>
            )}
          </EuiResizableContainer>
        </Context>
      </Suspense>
    </EuiPage>
  );
};
