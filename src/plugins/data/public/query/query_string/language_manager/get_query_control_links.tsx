/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { createEnsureDefaultIndexPattern } from '../../../../common/index_patterns/index_patterns/ensure_default_index_pattern';

const languageReference = {
  id: 'languageReference',
  label: i18n.translate('discover.queryControls.languageReference', {
    defaultMessage: 'Open',
  }),
  testId: 'languageReference',
  ariaLabel: i18n.translate('discover.queryControls.languageReference', {
    defaultMessage: `Language Reference`,
  }),
  run: () => {
    console.log('Open Language Reference');
    //   const flyoutSession = services.overlays.openFlyout(
    //     toMountPoint(
    //       <OpenSearchDashboardsContextProvider services={services}>
    //         <OpenSearchPanel
    //           onClose={() => {
    //             if (flyoutSession) {
    //               flyoutSession.close();
    //             }
    //           }}
    //           makeUrl={(searchId) => `#/view/${encodeURIComponent(searchId)}`}
    //         />
    //       </OpenSearchDashboardsContextProvider>
    //     )
    //   );
  },
  iconType: 'help',
};

const languageToggle = {
  id: 'languageToggle',
  label: i18n.translate('discover.queryControls.languageToggle', {
    defaultMessage: 'Toggle',
  }),
  testId: 'languageToggle',
  ariaLabel: i18n.translate('discover.queryControls.languageToggle', {
    defaultMessage: `Language Toggle`,
  }),
  run: () => {},
  iconType: 'minimize',
};

const savedQueryManagement = {
  id: 'savedQueryManagement',
  label: i18n.translate('discover.queryControls.savedQueryManagement', {
    defaultMessage: 'Open',
  }),
  testId: 'savedQueryManagement',
  ariaLabel: i18n.translate('discover.queryControls.savedQueryManagement', {
    defaultMessage: `Saved Query Management`,
  }),
  run: () => {
    console.log('Open Saved Query Management');
  },
  iconType: 'folderOpen',
};

export const createEnhancedQueryControls = () => {
  return [languageReference, languageToggle, savedQueryManagement];
};

export const createDefaultQueryControls = () => {
  return [languageReference, savedQueryManagement];
};
