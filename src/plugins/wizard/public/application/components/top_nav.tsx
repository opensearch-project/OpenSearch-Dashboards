/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PLUGIN_ID } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../utils/get_top_nav_config';
import { WizardServices } from '../../types';

import './top_nav.scss';
import { useIndexPattern } from '../utils/use';
import { useTypedSelector } from '../utils/state_management';
import { useSavedWizardVis } from '../utils/use/use_saved_wizard_vis';

export const TopNav = () => {
  // id will only be set for the edit route
  const { id: visualizationIdFromUrl } = useParams<{ id: string }>();
  const { services } = useOpenSearchDashboards<WizardServices>();
  const {
    setHeaderActionMenu,
    navigation: {
      ui: { TopNavMenu },
    },
  } = services;
  const rootState = useTypedSelector((state) => state);
  const hasUnappliedChanges = useTypedSelector(
    (state) => !!state.visualization.activeVisualization?.draftAgg
  );

  const savedWizardVis = useSavedWizardVis(services, visualizationIdFromUrl);

  const config = useMemo(() => {
    if (savedWizardVis === undefined) {
      return;
    }
    const { visualization: visualizationState, style: styleState } = rootState;

    return getTopNavConfig(
      {
        visualizationIdFromUrl,
        savedWizardVis,
        visualizationState,
        styleState,
        hasUnappliedChanges,
      },
      services
    );
  }, [hasUnappliedChanges, rootState, savedWizardVis, services, visualizationIdFromUrl]);

  const indexPattern = useIndexPattern();

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
