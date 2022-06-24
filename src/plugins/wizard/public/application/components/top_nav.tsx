/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useMemo, useEffect } from 'react';
import { PLUGIN_ID, VISUALIZE_ID } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavconfig } from '../utils/get_top_nav_config';
import { WizardServices } from '../../types';

import './top_nav.scss';
import { useIndexPattern } from '../utils/use';

export const TopNav = () => {
  const { services } = useOpenSearchDashboards<WizardServices>();
  const {
    setHeaderActionMenu,
    chrome,
    navigation: {
      ui: { TopNavMenu },
    },
  } = services;

  const config = useMemo(() => getTopNavconfig(services), [services]);
  const indexPattern = useIndexPattern();

  useEffect(() => {
    const visualizeHref = window.location.href.split(`${PLUGIN_ID}#/`)[0] + `${VISUALIZE_ID}#/`;
    chrome.setBreadcrumbs([
      {
        text: i18n.translate('visualize.listing.breadcrumb', {
          defaultMessage: 'Visualize',
        }),
        href: visualizeHref,
      },
      {
        text: i18n.translate('wizard.nav.breadcrumb.create', {
          defaultMessage: 'Create',
        }),
      },
    ]);
    // we want to run this hook exactly once, which you do by an empty dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wizTopNav">
      <TopNavMenu
        appName={PLUGIN_ID}
        config={config}
        setMenuMountPoint={setHeaderActionMenu}
        showSearchBar={true}
        useDefaultBehaviors={true}
        screenTitle="Test"
        indexPatterns={indexPattern ? [indexPattern] : []}
      />
    </div>
  );
};
