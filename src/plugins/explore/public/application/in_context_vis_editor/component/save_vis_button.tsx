/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0

 */

import { useObservable } from 'react-use';
import { useCallback, useState } from 'react';
import { EuiButtonEmpty, EuiConfirmModal, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';

import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useSavedExplore } from '../../utils/hooks/use_saved_explore';
import { useSearchContext } from '../../../components/query_panel/utils/use_search_context';
import { Query } from '../../../../../data/common';

import { SavedExplore } from '../../../saved_explore';
import { SaveVisModal } from './save_vis_modal';
import { useCurrentExploreId } from '../../../application/utils/hooks/use_current_explore_id';
import { useVisualizationBuilder } from '../hooks/use_visualization_builder';
import { EditorMode } from '../../utils/state_management/types';
import { ContainerState, CONTAINER_URL_KEY } from '../types';
import { SupportLanguageType } from '../query_builder/query_builder';
import {
  getUnrunQueryEdit,
  UnrunQueryEdit,
  UnrunQueryEditDetails,
  unrunQueryEditTitle,
} from '../../../helpers/unrun_query_edit';

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

const saveLastRunQueryText = i18n.translate('explore.topNav.saveVisButton.saveLastRunQuery', {
  defaultMessage: 'Save last-run query',
});

const cancelText = i18n.translate('explore.topNav.saveVisButton.cancel', {
  defaultMessage: 'Cancel',
});

export const SaveVisButton = () => {
  const { queryState, queryEditorState, datasetView, resultState, queryBuilder } =
    useQueryBuilderState();
  const { visualizationBuilderForEditor: visualizationBuilder } = useVisualizationBuilder();
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const transformationService = visualizationBuilder.getTransformationService();

  const { services } = useOpenSearchDashboards<ExploreServices>();

  const exploreId = useCurrentExploreId('edit');

  const { savedExplore } = useSavedExplore(exploreId);

  const { toastNotifications, chrome, embeddable, osdUrlStateStorage } = services;
  const stateTransfer = embeddable.getStateTransfer();
  const [showModal, setShowModal] = useState(false);
  // The unrun edits a save of an existing visualization waits on the user to confirm.
  const [unrunEditToConfirm, setUnrunEditToConfirm] = useState<UnrunQueryEdit>();
  // The unrun edits the save dialog of a new visualization says it won't store.
  const [unrunEditForModal, setUnrunEditForModal] = useState<UnrunQueryEdit>();

  const isQueryEditorDirty = queryEditorState.isQueryEditorDirty;
  const isVisDirty = useObservable(visualizationBuilder.isVisDirty$);
  const isPromptMode = queryEditorState.editorMode === EditorMode.Prompt;

  // directly read from url storage
  const { originatingApp, containerInfo } =
    osdUrlStateStorage?.get<ContainerState>(CONTAINER_URL_KEY) ?? {};

  const searchContext = useSearchContext();

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

      savedExploreToSave.searchSourceFields = {
        index: datasetView.dataView,
      };
      savedExploreToSave.copyOnSave = false;
      if (exploreId === undefined) {
        savedExploreToSave.copyOnSave = true; // always save a new copy for new explore visulization
      }
      const searchSourceInstance = savedExploreToSave.searchSourceFields;

      if (searchSourceInstance) {
        searchSourceInstance.query = searchContext.query as Query;
        if (isPromptMode) {
          // for prompt mode, store previous generated query string
          searchSourceInstance.query = {
            ...searchSourceInstance.query,
            query: queryEditorState.lastExecutedTranslatedQuery ?? '',
          };
        }
        searchSourceInstance.filter = searchContext.filters;
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
      searchContext.query,
      searchContext.filters,
      toastNotifications,
      isPromptMode,
      queryEditorState.lastExecutedTranslatedQuery,
      transformationService,
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

  // The save stores the query state, which is the query that last ran unless a dataset pick or a
  // language change emptied it. The editor's unrun edits aren't part of it: they are what Run
  // would run (the editor's text in Query mode on the query tab; other editors, the PromQL rows
  // and the builders, write their edits to the query state as they go).
  const getUnrunEdit = useCallback((): UnrunQueryEdit | undefined => {
    if (isPromptMode) return undefined;
    if ((queryEditorState.activeBottomPanelTab ?? 'QUERY_TAB') !== 'QUERY_TAB') return undefined;
    if (queryEditorState.languageType === SupportLanguageType.promQL) return undefined;
    const editor = queryBuilder?.getEditor?.();
    return getUnrunQueryEdit(queryState?.query, editor ? editor.getValue() : undefined);
  }, [
    isPromptMode,
    queryEditorState.activeBottomPanelTab,
    queryEditorState.languageType,
    queryBuilder,
    queryState?.query,
  ]);

  // A dataset pick or a language change that empties the query, not run since: saving it would
  // replace the chart's query with an empty one, which the chart can't be drawn from.
  const isQueryEmptiedSinceRun = useCallback((): boolean => {
    if (isPromptMode) return false;
    const lastRunQuery = queryBuilder?.getLastRunQueryState?.()?.query ?? '';
    return !(queryState?.query ?? '').trim() && !!lastRunQuery.trim();
  }, [isPromptMode, queryBuilder, queryState?.query]);

  // A dataset pick keeps the query (dataset_select), so the text can be unchanged while the dataset
  // isn't the one it ran on: the chart's axes come from the last run's columns, and saving the new
  // dataset with them can leave a panel that can't load.
  const isDatasetChangedSinceRun = useCallback((): boolean => {
    const lastRun = queryBuilder?.getLastRunQueryState?.()?.dataset;
    const current = queryState?.dataset;
    if (!lastRun || !current) return false;
    return lastRun.id !== current.id || lastRun.type !== current.type;
  }, [queryBuilder, queryState?.dataset]);

  const saveExisting = useCallback(async () => {
    if (exploreId === undefined || !savedExplore) return;
    await handleSave({
      savedExplore,
      newTitle: savedExplore.title ?? '',
      isTitleDuplicateConfirmed: true, // Not used for existing saved objects
      onTitleDuplicate: () => {}, // Not used for existing saved objects
    });
  }, [exploreId, savedExplore, handleSave]);

  const handleSaveButtonClick = useCallback(async () => {
    const isExisting = exploreId !== undefined && !!savedExplore;
    // If exploreId is defined, we're editing an existing saved visualization
    // Directly save without showing the modal
    if (isExisting && !isVisDirty && !isQueryEditorDirty) {
      navigateTo({ id: exploreId!, newTitle: savedExplore!.title });
      return;
    }

    if (isDatasetChangedSinceRun()) {
      toastNotifications.addWarning({
        title: i18n.translate('explore.editor.saveVisualization.datasetNotRunTitle', {
          defaultMessage: 'Not saved: the query has not run on this dataset',
        }),
        text: i18n.translate('explore.editor.saveVisualization.datasetNotRunText', {
          defaultMessage:
            'The visualization is drawn from the last run, on the previous dataset. Run the query on this one, then save again.',
        }),
        'data-test-subj': 'saveVisualizationDatasetNotRunWarning',
      });
      return;
    }

    if (isQueryEmptiedSinceRun()) {
      toastNotifications.addWarning({
        title: i18n.translate('explore.editor.saveVisualization.emptyQueryTitle', {
          defaultMessage: 'Not saved: the query is empty',
        }),
        text: i18n.translate('explore.editor.saveVisualization.emptyQueryText', {
          defaultMessage:
            'Changing the dataset or the language emptied the query, and the visualization needs one. Write a query and run it, or discard the changes.',
        }),
        'data-test-subj': 'saveVisualizationEmptyQueryWarning',
      });
      return;
    }

    const unrunEdit = getUnrunEdit();
    if (isExisting) {
      if (unrunEdit) {
        setUnrunEditToConfirm(unrunEdit);
        return;
      }
      await saveExisting();
    } else {
      // Show modal for new visualizations
      setUnrunEditForModal(unrunEdit);
      setShowModal(true);
    }
  }, [
    exploreId,
    savedExplore,
    isVisDirty,
    isQueryEditorDirty,
    navigateTo,
    isQueryEmptiedSinceRun,
    isDatasetChangedSinceRun,
    toastNotifications,
    getUnrunEdit,
    saveExisting,
  ]);

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

  const discardButtonColor = !isQueryEditorDirty && !isVisDirty ? 'primary' : 'danger';

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
          unrunQueryEdit={unrunEditForModal}
        />
      )}
      {unrunEditToConfirm && (
        <EuiConfirmModal
          title={unrunQueryEditTitle}
          onCancel={() => setUnrunEditToConfirm(undefined)}
          onConfirm={async () => {
            setUnrunEditToConfirm(undefined);
            await saveExisting();
          }}
          cancelButtonText={cancelText}
          confirmButtonText={saveLastRunQueryText}
          buttonColor="warning"
          defaultFocusedButton="cancel"
          data-test-subj="saveVisualizationUnrunEditConfirm"
        >
          <UnrunQueryEditDetails edit={unrunEditToConfirm} objectType="visualization" />
        </EuiConfirmModal>
      )}
    </EuiFlexGroup>
  );
};
