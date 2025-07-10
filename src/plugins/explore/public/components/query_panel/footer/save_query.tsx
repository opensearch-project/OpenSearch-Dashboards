/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { cloneDeep } from 'lodash';
import { EuiPopover, EuiButtonEmpty, EuiIcon } from '@elastic/eui';
import {
  SavedQueryManagementComponent,
  SavedQueryMeta,
  SavedQuery,
} from '../../../../../data/public';
import { selectQuery } from '../../../application/utils/state_management/selectors';
import { clearResults, setSavedQuery } from '../../../application/utils/state_management/slices';
import { ExploreServices } from '../../../types';
import { setQueryState } from '../../../application/utils/state_management/slices';
import { loadQueryActionCreator } from '../../../application/utils/state_management/actions/query_editor';
import { useTimeFilter } from '../utils';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { RootState } from '../../../application/utils/state_management/store';
import { executeQueries } from '../../../application/utils/state_management/actions/query_actions';
import { useClearEditorsAndSetText } from '../../../application/hooks';

export const SaveQueryButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { timeFilter } = useTimeFilter();
  const query = useSelector(selectQuery);
  const savedQueryService = services.data.query.savedQueries;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const dispatch = useDispatch();
  const clearEditorsAndSetText = useClearEditorsAndSetText();

  // Get current saved query ID from Redux state
  const currentSavedQueryId = useSelector((state: RootState) => state.legacy.savedQuery);

  // Get the actual saved query object if we have an ID
  const [currentSavedQuery, setCurrentSavedQuery] = useState<SavedQuery | undefined>();

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

  // Handle save query with Redux state management
  const handleSaveQuery = async (meta: SavedQueryMeta, saveAsNew?: boolean) => {
    try {
      if (!query) return;
      const clonedQuery = cloneDeep(query);
      delete clonedQuery.dataset;

      // Compose the SavedQueryAttributes object
      const attributes: any = {
        title: meta.title,
        description: meta.description,
        query: { ...clonedQuery },
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

      // Auto-close panel and execute current query
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
      // 1. Update Redux state with saved query ID
      dispatch(setSavedQuery(savedQuery.id));
      dispatch(setQueryState(savedQuery.attributes.query));
      dispatch(
        loadQueryActionCreator(
          services,
          clearEditorsAndSetText,
          savedQuery.attributes.query.query as string
        )
      );

      // 3. Update timefilter if present
      if (savedQuery.attributes.timefilter && timeFilter) {
        timeFilter.setTime({
          from: savedQuery.attributes.timefilter.from,
          to: savedQuery.attributes.timefilter.to,
        });
        if (typeof timeFilter.setRefreshInterval === 'function') {
          timeFilter.setRefreshInterval(savedQuery.attributes.timefilter.refreshInterval);
        }
      }

      // 4. Auto-close panel and execute
      setIsPopoverOpen(false);
      dispatch(clearResults());
      dispatch(executeQueries({ services }));
    },
    [dispatch, services, clearEditorsAndSetText, timeFilter]
  );

  const handleClearSavedQuery = useCallback(() => {
    dispatch(setSavedQuery(undefined));
    setIsPopoverOpen(false);
  }, [dispatch]);

  return (
    <>
      <EuiPopover
        button={
          <EuiButtonEmpty
            onClick={onButtonClick}
            iconType="save"
            className="queryPanel__footer__saveQueryButton"
            data-test-subj="queryPanelFootersaveQueryButton"
          >
            {i18n.translate('explore.queryPanel.saveQueryButton.savedQueries', {
              defaultMessage: 'Saved queries',
            })}
            <EuiIcon type="arrowDown" className="queryPanel__footer__saveQueryButtonIcon" />
          </EuiButtonEmpty>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
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
        />
      </EuiPopover>
    </>
  );
};
