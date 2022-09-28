/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUnmount } from 'react-use';
import { PLUGIN_ID } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../utils/get_top_nav_config';
import { WizardServices } from '../../types';

import './top_nav.scss';
import { useIndexPatterns, useSavedWizardVis } from '../utils/use';
import { useTypedSelector, useTypedDispatch } from '../utils/state_management';
import { setEditorState } from '../utils/state_management/metadata_slice';
import { useCanSave } from '../utils/use/use_can_save';
import { saveStateToSavedObject } from '../../saved_visualizations/transforms';

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
  const dispatch = useTypedDispatch();

  const saveDisabledReason = useCanSave();
  const savedWizardVis = useSavedWizardVis(visualizationIdFromUrl);
  const { selected: indexPattern } = useIndexPatterns();

  const config = useMemo(() => {
    if (!savedWizardVis || !indexPattern) return;

    return getTopNavConfig(
      {
        visualizationIdFromUrl,
        savedWizardVis: saveStateToSavedObject(savedWizardVis, rootState, indexPattern),
        saveDisabledReason,
        dispatch,
      },
      services
    );
  }, [
    savedWizardVis,
    visualizationIdFromUrl,
    rootState,
    indexPattern,
    saveDisabledReason,
    dispatch,
    services,
  ]);

  // reset validity before component destroyed
  useUnmount(() => {
    dispatch(setEditorState({ state: 'loading' }));
  });

  return (
    <div className="wizTopNav">
      <TopNavMenu
        appName={PLUGIN_ID}
        config={config}
        setMenuMountPoint={setHeaderActionMenu}
        indexPatterns={indexPattern ? [indexPattern] : []}
        showDatePicker={!!indexPattern?.timeFieldName ?? true}
        showSearchBar
        showSaveQuery
        useDefaultBehaviors
      />
    </div>
  );
};
