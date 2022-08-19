/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useUnmount from 'react-use/lib/useUnmount';
import { PLUGIN_ID } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../utils/get_top_nav_config';
import { WizardServices } from '../../types';

import './top_nav.scss';
import { useIndexPatterns, useSavedWizardVis } from '../utils/use';
import { useTypedSelector, useTypedDispatch } from '../utils/state_management';
import { setHasChange, setFinishLoading } from '../utils/state_management/metadata_slice';

// TODO: Need to finalize the error messages
const saveButtonMsg = (isEmpty, hasChange, hasUnappliedChanges) => {
  if (isEmpty) {
    return 'The canvas is empty. Add some aggregations before saving.';
  } else if (!hasChange) {
    return 'Add some changes before saving.';
  } else if (hasUnappliedChanges) {
    return 'Has unapplied aggregations changes, update them before saving.';
  } else {
    return '';
  }
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
  const hasUnappliedChanges = useTypedSelector(
    (state) => !!state.visualization.activeVisualization?.draftAgg
  );
  const isEmpty = useTypedSelector(
    (state) => state.visualization.activeVisualization?.aggConfigParams?.length === 0
  );
  const hasChange = useTypedSelector((state) => state.metadata.editorState.hasChange);
  const canSave = !isEmpty && hasChange && !hasUnappliedChanges;
  const errMsg = saveButtonMsg(isEmpty, hasChange, hasUnappliedChanges);
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
        canSave,
        errMsg,
        dispatch,
      },
      services
    );
  }, [rootState, savedWizardVis, services, visualizationIdFromUrl, canSave, errMsg, dispatch]);

  const indexPattern = useIndexPatterns().selected;

  // reset validity before component destroyed
  useUnmount(() => {
    dispatch(setHasChange({ hasChange: false }));
    dispatch(setFinishLoading({ finishLoading: false }));
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
