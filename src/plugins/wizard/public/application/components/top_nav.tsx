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

const useCanSave = (isEmpty, hasChange, hasDraftAgg) => {
  let errorMsg = '';

  // TODO: Need to finalize the error messages
  if (isEmpty) {
    errorMsg = 'The canvas is empty. Add some aggregations before saving.';
  } else if (!hasChange) {
    errorMsg = 'Add some changes before saving.';
  } else if (hasDraftAgg) {
    errorMsg = 'Has unapplied aggregations changes, update them before saving.';
  } else {
    errorMsg = '';
  }

  return {
    canSave: !isEmpty && hasChange && !hasDraftAgg,
    errorMsg,
  };
};

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

  const isEmpty = useTypedSelector(
    (state) => state.visualization.activeVisualization?.aggConfigParams?.length === 0
  );
  const hasChange = useTypedSelector((state) => state.metadata.editorState.state === 'dirty');
  const hasDraftAgg = useTypedSelector(
    (state) => !!state.visualization.activeVisualization?.draftAgg
  );

  const saveState = useCanSave(isEmpty, hasChange, hasDraftAgg);
  const savedWizardVis = useSavedWizardVis(visualizationIdFromUrl);

  const config = useMemo(() => {
    if (savedWizardVis === undefined) return;

    const { visualization: visualizationState, style: styleState } = rootState;

    return getTopNavConfig(
      {
        visualizationIdFromUrl,
        savedWizardVis,
        visualizationState,
        styleState,
        saveState,
        dispatch,
      },
      services
    );
  }, [rootState, savedWizardVis, services, visualizationIdFromUrl, saveState, dispatch]);

  const indexPattern = useIndexPatterns().selected;

  // reset validity before component destroyed
  useUnmount(() => {
    dispatch(setEditorState({ state: 'initial' }));
  });

  return (
    <div className="wizTopNav">
      <TopNavMenu
        appName={PLUGIN_ID}
        config={config}
        setMenuMountPoint={setHeaderActionMenu}
        indexPatterns={indexPattern ? [indexPattern] : []}
        showSearchBar
        showSaveQuery
        useDefaultBehaviors
      />
    </div>
  );
};
