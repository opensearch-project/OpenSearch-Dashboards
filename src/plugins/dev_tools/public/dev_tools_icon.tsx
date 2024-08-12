/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';

export function DevToolsIcon({ core, appId }: { core: CoreStart; appId: string }) {
  return (
    <EuiButtonIcon
      aria-label="go-to-dev-tools"
      iconType="consoleApp"
      onClick={() => {
        /**
         * This is a workaround in 2.16, once devTools being refactor to a drawer, we can remove the setCurrentNavGroup line.
         */
        core.chrome.navGroup.setCurrentNavGroup(DEFAULT_NAV_GROUPS.dataAdministration.id);
        core.application.navigateToApp(appId);
      }}
    />
  );
}
