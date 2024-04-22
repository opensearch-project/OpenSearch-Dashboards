/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppMountParameters } from '../../../../core/public';
import { useView } from '../utils/use';
import { AppContainer } from './app_container';

export const DataExplorerApp = ({ params }: { params: AppMountParameters }) => {
  const { view } = useView();
  return <AppContainer view={view} params={params} />;
};
