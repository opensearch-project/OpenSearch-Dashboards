/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { IndexPattern } from '../../../../data/public';
import { PLUGIN_ID } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavconfig } from '../utils/get_top_nav_config';
import { WizardServices } from '../../types';

import './top_nav.scss';

export const TopNav = () => {
  const { services } = useOpenSearchDashboards<WizardServices>();
  const {
    setHeaderActionMenu,
    navigation: {
      ui: { TopNavMenu },
    },
  } = services;

  const config = useMemo(() => getTopNavconfig(services), [services]);
  //   TODO: Set index pattern/data source here. Filters wont show up until you do
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[]>([]);

  return (
    <div className="wizTopNav">
      <TopNavMenu
        appName={PLUGIN_ID}
        config={config}
        setMenuMountPoint={setHeaderActionMenu}
        showSearchBar={true}
        useDefaultBehaviors={true}
        screenTitle="Test"
        indexPatterns={indexPatterns}
      />
    </div>
  );
};
