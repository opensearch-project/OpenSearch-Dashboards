/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';

export function DevToolsIcon({ core, appId }: { core: CoreStart; appId: string }) {
  return (
    <EuiButtonIcon
      aria-label="go-to-dev-tools"
      iconType="consoleApp"
      onClick={() => {
        core.application.navigateToApp(appId);
      }}
    />
  );
}
