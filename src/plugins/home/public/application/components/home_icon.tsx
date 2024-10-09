/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';

export function HomeIcon({ core, appId }: { core: CoreStart; appId: string }) {
  return (
    <EuiToolTip
      content={i18n.translate('home.icon.nav.title', {
        defaultMessage: 'Home',
      })}
    >
      <EuiButtonIcon
        aria-label="go-to-home"
        iconType="home"
        color="text"
        onClick={() => {
          core.application.navigateToApp(appId);
        }}
      />
    </EuiToolTip>
  );
}
