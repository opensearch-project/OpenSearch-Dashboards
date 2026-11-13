/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0

 */

import { useObservable } from 'react-use';
import { useCallback, useState } from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';

import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useSavedExplore } from '../../utils/hooks/use_saved_explore';
import { Query } from '../../../../../data/common';

import { SavedExplore } from '../../../saved_explore';
import { SaveVisModal } from './save_vis_modal';
import { useCurrentExploreId } from '../../../application/utils/hooks/use_current_explore_id';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';
import { useEditorDirty } from '../hooks/use_editor_dirty';
import { toSavedQueries } from '../multi_query_builder/utils';
import { ContainerState, CONTAINER_URL_KEY } from '../types';

export interface OnSaveProps {
  savedExplore: SavedExplore;
  newTitle: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
}

const saveAndBackButtonText = i18n.translate('explore.topNav.saveVisButton.saveBack', {
  defaultMessage: 'Save and back',
});

const discardButtonText = i18n.translate('explore.topNav.saveVisButton.discard', {
  defaultMessage: 'Discard changes',
});

const saveButtonText = i18n.translate('explore.topNav.saveVisButton.save', {
  defaultMessage: 'Save',
});

export const SaveVisButton = () => {
  const { datasetView, resultState, container } = useQueryBuilderState();
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const transformationService = visualizationBuilder.getTransformationService();

  const { services } = useOpenSearchDashboards<ExploreServices>();

  const exploreId = useCurrentExploreId('edit');

  const { savedExplore } = useSavedExplore(exploreId);

  const { toastNotifications, chrome, embeddable, osdUrlStateStorage } = services;
  const stateTransfer = embeddable.getStateTransfer();
  const [showModal, setShowModal] = useState(false);

  const { isDirty: isEditorDirty, confirmSave } = useEditorDirty();

  // directly read from url storage
  const { originatingApp, containerInfo } =
    osdUrlStateStorage?.get<ContainerState>(CONTAINER_URL_KEY) ?? {};

  // TODO delte global search context
  // The global query no longer mirrors the selected row, so save from the row itself.
  // const searchContext = useSearchContext();

  const navigateTo = useCallback(
    ({ id, newTitle }: { id: string; newTitle: string }) => {
      if (exploreId === undefined) {
        toastNotifications.addSuccess({
          title: i18n.translate('explore.editor.saveVisualization.successNotificationText', {
            defaultMessage: `Saved '{visTitle}'`,
            values: {
              visTitle: newTitle,
            },
          }),
          'data-test-subj': 'saveVisualizationSuccess',
        });
      } else {
        toastNotifications.addSuccess({
          title: i18n.translate('explore.editor.updateVisualization.successNotificationText', {
            defaultMessage: `Updated '{visTitle}'`,
            values: {
              visTitle: newTitle,
            },
          }),
          'data-test-subj': 'updateVisualizationSuccess',
        });
      }
      if (originatingApp) {
        // add a new panel or update existing panel
        const embeddablePackage =
          exploreId === undefined
            ? [
                {
                  state: {
                    type: 'explore',
                    input: { savedObjectId: id },
                    ...(containerInfo ? { containerInfo } : {}),
                  },
                },
              ]
            : [];
        stateTransfer.navigateToWithEmbeddablePackage(originatingApp, ...embeddablePackage);
      } else {
        // The in-context editor may not have originatingApp in cases such as a page reload
        // or when opened directly from the visualization list
        // In this case, just save the visualization without navigating back

        if (exploreId === undefined) {
          chrome.docTitle.change(newTitle);
          chrome.setBreadcrumbs([{ text: newTitle }]);
          services.scopedHistory?.push(`#/edit/${encodeURIComponent(id)}`);
        }
      }
    },
    [
      stateTransfer,
      exploreId,
      chrome,
      services.scopedHistory,
      toastNotifications,
      originatingApp,
      containerInfo,
    ]
  );

  const handleSave = useCallback(
    async ({
      savedExplore: savedExploreToSave,
      newTitle,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    }: OnSaveProps) => {
      const serializedPipeline = transformationService.serializePipeline();

      const axesMapping = visConfig?.axesMapping;
      const currentTitle = savedExploreToSave.title;
      savedExploreToSave.title = newTitle;
      savedExploreToSave.type = undefined; // save explores created in in-context editor don't have flavor
      savedExploreToSave.visualization = JSON.stringify({
        title: visConfig?.title,
        description: visConfig?.description,
        chartType: visConfig?.type ?? 'line',
        params: visConfig?.styles ?? {},
        axesMapping,
        splitField: visConfig?.splitField,
        splitLayout: visConfig?.splitLayout,
        showSplitLabel: visConfig?.showSplitLabel,
        dataTransformations: serializedPipeline,
      });
      savedExploreToSave.version = 1;

      // Every row, each with its hidden state, goes in queries.
      const savedContainerState = container.getContainerState();
      savedExploreToSave.queries = JSON.stringify(toSavedQueries(savedContainerState));
      // searchSourceJSON keeps first visible row for readers that know only it (the Explore pages)
      const { queries, editorState } = savedContainerState;
      const hiddenRefIds = new Set(
        editorState.rows.filter(([, state]) => state.isHidden).map(([refId]) => refId)
      );
      const [firstVisibleRefId, firstVisibleQuery] =
        queries.find(([refId]) => !hiddenRefIds.has(refId)) ?? queries[0];
      // A row hidden since it loaded may not have its dataset loaded: fall back to the selected one's.
      const firstVisibleDataView =
        container.getRow(firstVisibleRefId)?.datasetView$.getValue().dataView ??
        datasetView.dataView;

      savedExploreToSave.searchSourceFields = {
        index: firstVisibleDataView,
      };
      savedExploreToSave.copyOnSave = false;
      if (exploreId === undefined) {
        savedExploreToSave.copyOnSave = true; // always save a new copy for new explore visulization
      }
      const searchSourceInstance = savedExploreToSave.searchSourceFields;

      if (searchSourceInstance) {
        // A metrics row already carries max data points on its queryOptions.
        searchSourceInstance.query = firstVisibleQuery as Query;

        // Filters are shared by every row; read them at save time.
        searchSourceInstance.filter = services.data.query.filterManager.getFilters();
      }

      const saveOptions = {
        confirmOverwrite: false,
        isTitleDuplicateConfirmed,
        onTitleDuplicate,
        returnToOrigin: true,
      };
      try {
        const id = await savedExploreToSave.save(saveOptions);
        if (id) {
          confirmSave();
          setShowModal(false);
          navigateTo({ id, newTitle });
        }
      } catch (error) {
        toastNotifications.add({
          title: i18n.translate('explore.editor.saveVisualization.notification.fail', {
            defaultMessage: 'Fail to update visualization',
          }),
          color: 'danger',
          iconType: 'alert',
          text: toMountPoint(error),
        });
        savedExploreToSave.title = currentTitle;
        setShowModal(false);
      }
    },
    [
      visConfig,
      datasetView.dataView,
      exploreId,
      navigateTo,
      container,
      services.data.query.filterManager,
      toastNotifications,
      transformationService,
      confirmSave,
    ]
  );

  const handleDiscard = useCallback(() => {
    if (originatingApp) {
      stateTransfer.navigateToWithEmbeddablePackage(originatingApp);
    } else {
      // Reload the current edit page to discard changes
      const url =
        exploreId !== undefined && savedExplore ? `#/edit/${encodeURIComponent(exploreId)}` : '#/';
      services.scopedHistory?.push(url);
      window.location.reload();
    }
  }, [stateTransfer, services.scopedHistory, exploreId, savedExplore, originatingApp]);

  const handleSaveButtonClick = useCallback(async () => {
    // If exploreId is defined, we're editing an existing saved visualization
    // Directly save without showing the modal
    if (exploreId !== undefined && savedExplore) {
      if (!isEditorDirty) {
        navigateTo({ id: exploreId, newTitle: savedExplore.title });
        return;
      }
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
  }, [exploreId, savedExplore, handleSave, isEditorDirty, navigateTo]);

  const saveButton = (
    <EuiButtonEmpty
      onClick={handleSaveButtonClick}
      data-test-subj="saveVisualizationEditorButton"
      color="primary"
      size="s"
    >
      {originatingApp ? saveAndBackButtonText : saveButtonText}
    </EuiButtonEmpty>
  );

  const discardButtonColor = !isEditorDirty ? 'primary' : 'danger';

  const discardButton = (
    <EuiButtonEmpty
      onClick={handleDiscard}
      data-test-subj="discardVisualizationEditorButton"
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
          initialTitle={visConfig?.title}
          onCancel={() => setShowModal(false)}
          onConfirm={handleSave}
          showComplexQueryWarning={resultState?.profile?.isComplex ?? false}
        />
      )}
    </EuiFlexGroup>
  );
};
