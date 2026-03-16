/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0

 */

import { useObservable } from 'react-use';
import React, { useCallback, useState } from 'react';
import { EuiButtonEmpty, EuiText, EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';

import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useSavedExplore } from '../../utils/hooks/use_saved_explore';
import { getVisualizationBuilder } from '../../../components/visualizations/visualization_builder';
import { useSearchContext } from '../../../components/query_panel/utils/use_search_context';
import { Query } from '../../../../../data/common';

import { SavedExplore } from '../../../saved_explore';
import { SaveVisModal } from './save_vis_modal';
import { useInContextEditor } from '../../context';
import { addToDashboard } from '../../../components/visualizations/utils/add_to_dashboard';

export interface OnSaveProps {
  savedExplore: SavedExplore;
  newTitle: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
}

const saveButtonText = i18n.translate('explore.topNav.saveVisButton.save', {
  defaultMessage: 'Save and back to dashboard',
});

const discardButtonText = i18n.translate('explore.topNav.saveVisButton.discard', {
  defaultMessage: 'Discard panel changes',
});

const saveButtonWithoutBackText = i18n.translate('explore.topNav.saveVisButton.save', {
  defaultMessage: 'Save visualization',
});

export const SaveVisButton = () => {
  const { queryEditorState, datasetView } = useQueryBuilderState();
  const visualizationBuilder = getVisualizationBuilder();
  const visConfig = visualizationBuilder.visConfig$.value;

  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { exploreId, containerId } = useInContextEditor();

  const { savedExplore } = useSavedExplore(exploreId);
  const isQueryEditorDirty = queryEditorState.isQueryEditorDirty;

  const { toastNotifications, dashboard, core } = services;

  const [showModal, setShowModal] = useState(false);

  const isVisDirty = useObservable(visualizationBuilder.isVisDirty$);

  const searchContext = useSearchContext();
  // const { startSyncingQueryStateWithUrl } = useSyncQueryStateWithUrl(
  //   data.query,
  //   services.osdUrlStateStorage!
  // );

  const handleSave = useCallback(
    async ({
      savedExplore: savedExploreToSave,
      newTitle,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    }: OnSaveProps) => {
      const axesMapping = visConfig?.axesMapping;

      savedExploreToSave.title = newTitle;
      savedExploreToSave.type = undefined; // in-context editor created save explore don't have flavor
      savedExploreToSave.visualization = JSON.stringify({
        title: '',
        chartType: visConfig?.type ?? 'line',
        params: visConfig?.styles ?? {},
        axesMapping,
      });
      savedExploreToSave.version = 1;

      savedExploreToSave.searchSourceFields = {
        index: datasetView.dataView,
      };

      const saveOptions = {
        isTitleDuplicateConfirmed,
        onTitleDuplicate,
      };
      try {
        savedExploreToSave.title = newTitle;
        if (exploreId === undefined) {
          savedExploreToSave.copyOnSave = true;
        }
        const searchSourceInstance = savedExploreToSave.searchSourceFields;

        if (searchSourceInstance) {
          searchSourceInstance.query = searchContext.query as Query;
          searchSourceInstance.filter = searchContext.filters;
        }

        const id = await savedExploreToSave.save(saveOptions);

        // add to dashboard
        if (id && exploreId === undefined) {
          const props = {
            existingDashboardId: containerId,
          };

          const dashboardId = await addToDashboard(
            dashboard,
            { id, type: 'explore' },
            'existing',
            props
          );

          if (dashboardId) {
            const toastContent = (
              <EuiText size="s">
                <p>
                  {i18n.translate('explore.addToDashboard.notification.success.message', {
                    defaultMessage: `Explore '{newTitle}' is successfully added to the dashboard.`,
                    values: { newTitle },
                  })}
                </p>
              </EuiText>
            );

            toastNotifications.add({
              title: i18n.translate('explore.addToDashboard.notification.success.message.toast', {
                defaultMessage: 'Panel added to dashboard',
              }),
              color: 'success',
              iconType: 'check',
              text: toMountPoint(toastContent),
              'data-test-subj': 'addToExistingDashboardSuccessToastInContext',
            });
          }
        }
        // startSyncingQueryStateWithUrl();
        setShowModal(false);
        // Use window.location.href for full page reload to ensure dashboard refreshes
        const dashboardUrl = core.application.getUrlForApp('dashboards', {
          path: containerId ? `#/view/${containerId}` : '#/',
        });

        // if(!containerId){
        //   history.back()
        // }
        window.location.href = dashboardUrl;
      } catch (error) {
        toastNotifications.add({
          title: i18n.translate('explore.addToDashboard.notification.fail', {
            defaultMessage: 'Fail to add to dashboard',
          }),
          color: 'danger',
          iconType: 'alert',
          text: toMountPoint(error),
          'data-test-subj': 'addToNewDashboarddFailToast',
        });

        setShowModal(false);
      }
    },
    [
      visConfig,
      datasetView.dataView,
      exploreId,
      searchContext.query,
      searchContext.filters,
      dashboard,
      core.application,
      toastNotifications,
      containerId,
    ]
  );

  const handleDiscard = useCallback(() => {
    // startSyncingQueryStateWithUrl();

    const dashboardUrl = core.application.getUrlForApp('dashboards', {
      path: containerId ? `#/view/${containerId}` : '#/',
    });

    window.location.href = dashboardUrl;
  }, [core.application, containerId]);

  const handleSaveButtonClick = useCallback(async () => {
    // If exploreId is defined, we're editing an existing saved visualization
    // Directly save without showing the modal
    if (exploreId !== undefined && savedExplore) {
      await handleSave({
        savedExplore,
        newTitle: savedExplore.title ?? '',
        isTitleDuplicateConfirmed: true, // Not used for existing saved objects
        onTitleDuplicate: () => {}, // Not used for existing saved objects
      });
    } else {
      // Show modal for new visualizations
      setShowModal(true);
    }
  }, [exploreId, savedExplore, handleSave]);

  const saveButton = (
    <EuiButtonEmpty
      onClick={handleSaveButtonClick}
      data-test-subj="saveInContextVisButton"
      color="primary"
      size="s"
    >
      {containerId ? saveButtonText : saveButtonWithoutBackText}
    </EuiButtonEmpty>
  );

  const discardButtonColor = !isQueryEditorDirty && !isVisDirty ? 'primary' : 'danger';

  const discardButton = (
    <EuiButtonEmpty
      isDisabled={!isQueryEditorDirty && !isVisDirty}
      onClick={handleDiscard}
      data-test-subj="discardInContextVisButton"
      color={discardButtonColor}
      size="s"
    >
      {discardButtonText}
    </EuiButtonEmpty>
  );

  return (
    <EuiFlexGroup gutterSize="s" responsive={false} style={{ justifyContent: 'end' }}>
      <EuiFlexItem grow={false}>{saveButton}</EuiFlexItem>
      <EuiFlexItem grow={false}>{discardButton}</EuiFlexItem>
      {showModal && (
        <SaveVisModal
          savedExploreId={exploreId}
          onCancel={() => setShowModal(false)}
          onConfirm={handleSave}
        />
      )}
    </EuiFlexGroup>
  );
};
