/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageTemplate } from '@elastic/eui';
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

  const { Canvas, Panel } = view;

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <EuiPageTemplate
      pageSideBar={
        <Sidebar>
          <Suspense fallback={<div>Loading...</div>}>
            <Panel {...params} />
          </Suspense>
        </Sidebar>
      }
      pageSideBarProps={{
        className: 'deSidebar',
      }}
      className="dePageTemplate"
      template="default"
      restrictWidth={false}
      paddingSize="none"
    >
      {/* TODO: improve loading state */}
      <Suspense fallback={<div>Loading...</div>}>
        <Canvas {...params} />
      </Suspense>
    </EuiPageTemplate>
  );
};
