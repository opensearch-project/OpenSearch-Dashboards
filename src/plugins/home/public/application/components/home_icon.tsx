/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';

export function HomeIcon({ core, appId }: { core: CoreStart; appId: string }) {
  return (
    <EuiButtonIcon
      aria-label="go-to-home"
      iconType="home"
      onClick={() => {
        core.application.navigateToApp(appId);
      }}
    />
  );
}
