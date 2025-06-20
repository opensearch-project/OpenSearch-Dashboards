/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';

export function addHelpMenuToAppChrome(
  chrome: CoreStart['chrome'],
  docLinks: CoreStart['docLinks']
) {
  chrome.setHelpExtension({
    appName: i18n.translate('devTools.helpMenu.appName', {
      defaultMessage: 'Dev Tools',
    }),
    links: [
      {
        linkType: 'documentation',
        // @ts-expect-error TS2339 TODO(ts-error): fixme
        href: `${docLinks.links.opensearchDashboards.devTools}`,
      },
    ],
  });
}
