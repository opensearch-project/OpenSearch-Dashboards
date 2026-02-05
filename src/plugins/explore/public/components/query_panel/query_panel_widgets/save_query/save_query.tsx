/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { useEditorText, useSetEditorTextWithQuery } from '../../../../application/hooks';
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

      const queryToSave = {
        ...clonedQuery,
        query: getEditorText(),
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
        i18n.translate('explore.queryPanel.saveQuery.failedToSaveQuery', {
          defaultMessage: 'An error occured while saving your query{errorMessage}',
          values: { errorMessage: error.message ? `: ${error.message}` : '' },
        })
      );
      throw error;
    }
  };

  const handleLoadSavedQuery = useCallback(
    (savedQuery: SavedQuery) => {
      dispatch(setSavedQuery(savedQuery.id));
      dispatch(setQueryState(savedQuery.attributes.query));
      dispatch(
        // @ts-expect-error TS2345 TODO(ts-error): fixme
        loadQueryActionCreator(
          services,
          setEditorTextWithQuery,
          savedQuery.attributes.query.query as string
        )
      );

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
      dispatch(clearResults());
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      dispatch(executeQueries({ services }));
    },
    [dispatch, services, setEditorTextWithQuery, timeFilter]
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
