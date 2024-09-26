/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';

export function DevToolsIcon({ core, appId }: { core: CoreStart; appId: string }) {
  return (
    <EuiToolTip
      content={i18n.translate('devTools.icon.nav.title', {
        defaultMessage: 'Developer tools',
      })}
    >
      <EuiButtonIcon
        aria-label="go-to-dev-tools"
        iconType="consoleApp"
        onClick={() => {
          core.application.navigateToApp(appId);
        }}
      />
    </EuiToolTip>
  );
}
