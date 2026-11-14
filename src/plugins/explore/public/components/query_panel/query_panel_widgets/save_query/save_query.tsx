/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { i18n } from '@osd/i18n';
import { cloneDeep } from 'lodash';
import { EuiPopover, EuiButtonEmpty, EuiIcon, EuiText } from '@elastic/eui';
import {
  SavedQueryManagementComponent,
  SavedQueryMeta,
  SavedQuery,
} from '../../../../../../data/public';
import {
  selectQuery,
  selectIsPromptEditorMode,
} from '../../../../application/utils/state_management/selectors';
import {
  clearResults,
  setDateRange,
  setSavedQuery,
} from '../../../../application/utils/state_management/slices';
import { ExploreServices } from '../../../../types';
import { setQueryState } from '../../../../application/utils/state_management/slices';
import { loadQueryActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { useTimeFilter } from '../../utils';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { RootState } from '../../../../application/utils/state_management/store';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';
import {
  datasetRequiresExplicitRun,
  stageQueryForExplicitRun,
} from '../../../../application/utils/requires_explicit_run';
import { useEditorText, useSetEditorTextWithQuery } from '../../../../application/hooks';
import {
  getDatasetForSavedQuery,
  getStoredSavedQueryDataset,
  savedQueryMayHaveStoredDataset,
} from '../../../../application/utils/saved_query_dataset';
import './save_query.scss';

export const SaveQueryButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { timeFilter } = useTimeFilter();
  const query = useSelector(selectQuery);
  const getEditorText = useEditorText();
  const savedQueryService = services.data.query.savedQueries;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const isPromptMode = useSelector(selectIsPromptEditorMode);
  const dispatch = useDispatch();
  const setEditorTextWithQuery = useSetEditorTextWithQuery();

  // Get current saved query ID from Redux state
  const currentSavedQueryId = useSelector((state: RootState) => state.legacy.savedQuery);
  const store = useStore();
  const latestLoadRef = useRef(0);

  // Get the actual saved query object if we have an ID
  const [currentSavedQuery, setCurrentSavedQuery] = useState<SavedQuery | undefined>();
  const saveButtonIsDisabled = isPromptMode;

  // Load saved query when ID changes
  useEffect(() => {
    if (currentSavedQueryId) {
      savedQueryService
        .getSavedQuery(currentSavedQueryId)
        .then(setCurrentSavedQuery)
        .catch(() => {
          // If saved query doesn't exist, clear the ID
          dispatch(setSavedQuery(undefined));
          setCurrentSavedQuery(undefined);
        });
    } else {
      setCurrentSavedQuery(undefined);
    }
  }, [currentSavedQueryId, savedQueryService, dispatch]);

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const handleSaveQuery = async (meta: SavedQueryMeta, saveAsNew?: boolean) => {
    try {
      if (!query) return;
      const clonedQuery = cloneDeep(query);
      delete clonedQuery.dataset;
      // An index pattern's or index's query is saved without its dataset; another type's keeps it.
      const datasetToSave = getDatasetForSavedQuery(query.dataset);
      if (datasetToSave) clonedQuery.dataset = datasetToSave;

      const editorText = getEditorText();
      const queryToSave = {
        ...clonedQuery,
        query: editorText || String(services.data.query.queryString.getQuery().query || ''),
      };

      const attributes: any = {
        title: meta.title,
        description: meta.description,
        query: queryToSave,
      };

      if (meta.shouldIncludeTimeFilter && timeFilter && typeof timeFilter.getTime === 'function') {
        const tf = timeFilter.getTime();
        if (
          tf &&
          tf.from !== undefined &&
          tf.to !== undefined &&
          typeof timeFilter.getRefreshInterval === 'function'
        ) {
          const refresh = timeFilter.getRefreshInterval();
          attributes.timefilter = {
            from: tf.from,
            to: tf.to,
            refreshInterval: refresh,
          };
        }
      }

      // Save query with overwrite option based on saveAsNew flag
      const savedQuery = await savedQueryService.saveQuery(attributes, {
        overwrite: !saveAsNew && !!currentSavedQueryId,
      });

      // Update Redux state with new saved query ID
      dispatch(setSavedQuery(savedQuery.id));

      services.notifications.toasts.addSuccess(`Your query "${attributes.title}" was saved`);

      setIsPopoverOpen(false);
    } catch (error) {
      services.notifications.toasts.addDanger(
        i18n.translate('explore.editor.queryPanel.saveQuery.saveQueryFailure', {
          defaultMessage: 'An error occurred while saving your query{errorMessage}',
          values: { errorMessage: error.message ? `: ${error.message}` : '' },
        })
      );
      throw error;
    }
  };

  const handleLoadSavedQuery = useCallback(
    async (savedQuery: SavedQuery) => {
      const queryString = services.data?.query?.queryString;
      // A load reads the saved object again before it applies anything, so a later pick can resolve
      // first: only the latest pick applies, and the dataset on screen is read once it resolves.
      const loadId = ++latestLoadRef.current;
      // A query saved with its dataset (not an index pattern or index) loads on that dataset, in
      // its language. Others load on the dataset on screen, as before.
      const storedDataset = savedQueryMayHaveStoredDataset(
        queryString,
        (store.getState() as RootState).query?.dataset,
        savedQuery
      )
        ? await getStoredSavedQueryDataset(savedQueryService, queryString, savedQuery)
        : undefined;
      if (loadId !== latestLoadRef.current) return;
      const currentDataset = (store.getState() as RootState).query?.dataset;
      const switchesDataset =
        !!storedDataset &&
        (storedDataset.id !== currentDataset?.id || storedDataset.type !== currentDataset?.type);
      // Only a switch takes the stored dataset. The stored copy holds just the fields the saved
      // query mapping has, so for the dataset already on screen the live one is kept: replacing it
      // with the copy would be taken for a dataset change (clearing the results and re-running)
      // and would drop the fields the copy doesn't carry.
      const loadedDataset =
        storedDataset && !switchesDataset
          ? (currentDataset ?? storedDataset)
          : (storedDataset ?? savedQuery.attributes.query?.dataset);

      dispatch(setSavedQuery(savedQuery.id));
      dispatch(setQueryState({ ...savedQuery.attributes.query, dataset: loadedDataset }));
      if (switchesDataset) {
        // The dataset change clears the results and runs the query, unless the dataset requires
        // an explicit Run (see the dataset change middleware): only the editor is set here.
        setEditorTextWithQuery(savedQuery.attributes.query.query as string);
      } else {
        dispatch(
          // @ts-expect-error TS2345 TODO(ts-error): fixme
          loadQueryActionCreator(
            services,
            setEditorTextWithQuery,
            savedQuery.attributes.query.query as string,
            loadedDataset
          )
        );
      }

      if (savedQuery.attributes.timefilter && timeFilter) {
        dispatch(
          setDateRange({
            from: savedQuery.attributes.timefilter.from,
            to: savedQuery.attributes.timefilter.to,
          })
        );
        if (typeof timeFilter.setRefreshInterval === 'function') {
          timeFilter.setRefreshInterval(savedQuery.attributes.timefilter.refreshInterval);
        }
      }

      setIsPopoverOpen(false);
      // A dataset type that requires an explicit Run waits for the user.
      if (datasetRequiresExplicitRun(queryString, loadedDataset)) {
        // Nothing runs to apply the saved time range to the time picker: apply it here, so the
        // picker shows the range the staged query runs on.
        if (savedQuery.attributes.timefilter && typeof timeFilter?.setTime === 'function') {
          timeFilter.setTime({
            from: savedQuery.attributes.timefilter.from,
            to: savedQuery.attributes.timefilter.to,
          });
        }
        dispatch(clearResults());
        stageQueryForExplicitRun(dispatch);
        return;
      }
      if (switchesDataset) return;
      dispatch(clearResults());
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      dispatch(executeQueries({ services }));
    },
    [dispatch, services, setEditorTextWithQuery, timeFilter, savedQueryService, store]
  );

  const handleClearSavedQuery = useCallback(() => {
    dispatch(setSavedQuery(undefined));
    setIsPopoverOpen(false);
  }, [dispatch]);

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          onClick={onButtonClick}
          data-test-subj="queryPanelFooterSaveQueryButton"
          size="xs"
        >
          <div className="exploreSaveQuery__buttonTextWrapper">
            <EuiIcon type="save" size="s" />
            <EuiText size="xs">
              {i18n.translate('explore.queryPanel.saveQueryButton.savedQueries', {
                defaultMessage: 'Saved queries',
              })}
            </EuiText>
            <EuiIcon type="arrowDown" size="s" />
          </div>
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      anchorPosition="downCenter"
      panelPaddingSize="none"
      panelClassName="exploreSaveQuery__popoverContent"
    >
      <SavedQueryManagementComponent
        savedQueryService={savedQueryService}
        loadedSavedQuery={currentSavedQuery}
        onInitiateSave={() => {}}
        onInitiateSaveAsNew={() => {}}
        onLoad={handleLoadSavedQuery}
        onClearSavedQuery={handleClearSavedQuery}
        closeMenuPopover={() => setIsPopoverOpen(false)}
        showSaveQuery={!!services.capabilities?.explore?.saveQuery}
        saveQuery={handleSaveQuery}
        useNewSavedQueryUI={true}
        saveQueryIsDisabled={saveButtonIsDisabled}
        textSize="xs"
      />
    </EuiPopover>
  );
};
