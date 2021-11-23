/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage } from '@elastic/eui';
import { DataPublicPluginStart, IndexPattern } from '../../../data/public';
import { SideNav } from './components/side_nav';
import { DragDropProvider } from './utils/drag_drop/drag_drop_context';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WizardServices } from '../types';
import { Workspace } from './components/workspace';

import './app.scss';
import { TopNav } from './components/top_nav';

export const WizardApp = () => {
  const {
    services: { data },
  } = useOpenSearchDashboards<WizardServices>();

  const [indexPattern, setIndexPattern] = useIndexPattern(data);

  // Render the application DOM.
  return (
    <I18nProvider>
      <DragDropProvider>
        <EuiPage className="wizLayout">
          <TopNav />
          <SideNav indexPattern={indexPattern} setIndexPattern={setIndexPattern} />
          <Workspace />
        </EuiPage>
      </DragDropProvider>
    </I18nProvider>
  );
};

// TODO: Temporary. Need to update it fetch the index pattern cohesively
function useIndexPattern(data: DataPublicPluginStart) {
  const [indexPattern, setIndexPattern] = useState<IndexPattern | null>(null);
  useEffect(() => {
    const fetchIndexPattern = async () => {
      const defaultIndexPattern = await data.indexPatterns.getDefault();
      if (defaultIndexPattern) {
        setIndexPattern(defaultIndexPattern);
      }
    };
    fetchIndexPattern();
  }, [data.indexPatterns]);

  return [indexPattern, setIndexPattern] as const;
}
