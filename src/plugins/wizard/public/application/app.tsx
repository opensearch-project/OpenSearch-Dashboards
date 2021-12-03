/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage } from '@elastic/eui';
import { DataPublicPluginStart } from '../../../data/public';
import { SideNav } from './components/side_nav';
import { DragDropProvider } from './utils/drag_drop/drag_drop_context';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WizardServices } from '../types';
import { Workspace } from './components/workspace';

import './app.scss';
import { TopNav } from './components/top_nav';
import { useTypedDispatch } from './utils/state_management';
import { setIndexPattern } from './utils/state_management/datasource_slice';

export const WizardApp = () => {
  const {
    services: { data },
  } = useOpenSearchDashboards<WizardServices>();

  useIndexPattern(data);

  // Render the application DOM.
  return (
    <I18nProvider>
      <DragDropProvider>
        <EuiPage className="wizLayout">
          <TopNav />
          <SideNav />
          <Workspace />
        </EuiPage>
      </DragDropProvider>
    </I18nProvider>
  );
};

// TODO: Temporary. Need to update it fetch the index pattern cohesively
function useIndexPattern(data: DataPublicPluginStart) {
  const dispatch = useTypedDispatch();

  useEffect(() => {
    const fetchIndexPattern = async () => {
      const defaultIndexPattern = await data.indexPatterns.getDefault();
      if (defaultIndexPattern) {
        dispatch(setIndexPattern(defaultIndexPattern));
      }
    };
    fetchIndexPattern();
  }, [data.indexPatterns, dispatch]);
}
