/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageTemplate } from '@elastic/eui';

import { CoreStart, ScopedHistory } from '../../../../core/public';
import { Sidebar } from './sidebar';
import { useView } from '../utils/use';
import { NoView } from './no_view';

interface DataExplorerAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  history: ScopedHistory;
}

export const DataExplorerApp = ({ basename, history }: DataExplorerAppDeps) => {
  const { view } = useView();

  if (!view) {
    return <NoView />;
  }

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <EuiPageTemplate
      pageSideBar={<Sidebar />}
      className="dePageTemplate"
      template="default"
      restrictWidth={false}
      paddingSize="none"
    >
      <React.Suspense fallback={<div>Loading...</div>}>{view.ui.canvas}</React.Suspense>
    </EuiPageTemplate>
  );
};
