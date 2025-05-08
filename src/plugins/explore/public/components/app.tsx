/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import { CoreStart } from '../../../../core/public';
import { NavigationPublicPluginStart, TopNavMenuItemRenderType } from '../../../navigation/public';

import { PLUGIN_ID } from '../../common';

interface ExploreAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

export const ExploreApp = ({ basename, notifications, http, navigation }: ExploreAppDeps) => {
  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu
            appName={PLUGIN_ID}
            useDefaultBehaviors={true}
            config={[]}
            showSearchBar={TopNavMenuItemRenderType.IN_PLACE}
            showDatePicker={TopNavMenuItemRenderType.IN_PORTAL}
            showSaveQuery={true}
          />
        </>
      </I18nProvider>
    </Router>
  );
};
