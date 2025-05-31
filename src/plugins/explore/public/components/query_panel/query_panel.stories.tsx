/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryPanel } from './index';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';

const mockUiSettings = {
  get: (key: string, defaultValue: any) => defaultValue,
  get$: (key: string, defaultValue: any) => ({
    subscribe: (cb: any) => {
      cb(defaultValue);
      return { unsubscribe: () => {} };
    },
  }),
};

export const StorybookProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <OpenSearchDashboardsContextProvider services={{ uiSettings: mockUiSettings }}>
    {children}
  </OpenSearchDashboardsContextProvider>
);

export default {
  component: QueryPanel,
  title: 'src/plugins/explore/public/components/query_panel/index.tsx',
};

export function QueryEditor() {
  return (
    <StorybookProviders>
      <QueryPanel />
    </StorybookProviders>
  );
}
