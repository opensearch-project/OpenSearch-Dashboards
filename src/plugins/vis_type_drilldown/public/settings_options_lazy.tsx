/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';

// @ts-ignore
const SettingsOptionsComponent = lazy(() => import('./settings_options'));

export const SettingsOptions = (props: any) => (
  <Suspense fallback={<EuiLoadingSpinner />}>
    <SettingsOptionsComponent {...props} />
  </Suspense>
);
