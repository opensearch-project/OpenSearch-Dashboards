/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart, ScopedHistory } from '../../../../core/public';
import { useView } from '../utils/use';
import { AppContainer } from './app_container';

interface DataExplorerAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  history: ScopedHistory;
}

export const DataExplorerApp = (deps: DataExplorerAppDeps) => {
  const { view } = useView();

  return <AppContainer view={view} />;
};
