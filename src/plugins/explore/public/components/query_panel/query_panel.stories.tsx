/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryPanel } from './query_panel';
import { StorybookProviders } from './mock_provider.mocks';

export default {
  component: QueryPanel,
  title: 'src/plugins/explore/public/components/query_panel',
};

export function QueryEditor() {
  return (
    <StorybookProviders>
      <QueryPanel />
    </StorybookProviders>
  );
}
