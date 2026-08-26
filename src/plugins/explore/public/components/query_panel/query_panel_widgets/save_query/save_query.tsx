/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { cloneDeep } from 'lodash';
import { EuiPopover, EuiButtonEmpty, EuiIcon, EuiPopoverTitle, EuiText } from '@elastic/eui';
import {
  Query,
  RecentQueriesTable,
  SavedQueryManagementComponent,
  SavedQueryMeta,
  SavedQuery,
  TimeRange,
  runPPLAnalyzeInBackground,
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
  const { timeFilter, handleTimeChange } = useTimeFilter();
  const query = useSelector(selectQuery);
  const getEditorText = useEditorText();
  const savedQueryService = services.data.query.savedQueries;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // The popover has two views: the option list, and the recent-queries table reached from its
  // "Recent queries" option. Kept here rather than inside SavedQueryManagementComponent because
  // the table is explore's (it needs explore's run-this-query wiring) and because the panel has to
  // widen for it.
  const [showRecentQueries, setShowRecentQueries] = useState(false);
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

  // Always reopens on the option list: landing back on the recent-queries table you last looked at
  // would hide the Save/Open options behind a back button.
  const onButtonClick = useCallback(() => {
    setShowRecentQueries(false);
    setIsPopoverOpen((open) => !open);
  }, []);
  const closePopover = useCallback(() => {
    setIsPopoverOpen(false);
    setShowRecentQueries(false);
  }, []);

  // Inherited from the retired Recent queries button, which is now the "Recent queries" option of
  // this popover. The key still opens the popover; recents are one click deeper.
  const { keyboardShortcut } = services;
  keyboardShortcut?.useKeyboardShortcut({
    id: 'saved_queries',
    pluginId: 'explore',
    name: i18n.translate('explore.keyboardShortcut.savedQueries.name', {
      defaultMessage: 'Saved queries',
    }),
    category: i18n.translate('explore.keyboardShortcut.category.search', {
      defaultMessage: 'Search',
    }),
    keys: 'shift+q',
    execute: onButtonClick,
  });

  const handleSaveQuery = async (meta: SavedQueryMeta, saveAsNew?: boolean) => {
    try {
      if (!query) return;
      const clonedQuery = cloneDeep(query);
      delete clonedQuery.dataset;

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

      closePopover();
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

      closePopover();
      dispatch(clearResults());
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      dispatch(executeQueries({ services }));
    },
    [closePopover, dispatch, services, setEditorTextWithQuery, timeFilter]
  );

  const handleRunRecentQuery = useCallback(
    (selectedQuery: Query, timeRange?: TimeRange) => {
      const updatedQuery = typeof selectedQuery.query === 'string' ? selectedQuery.query : '';
      closePopover();
      // NOTE: `timeRange` is currently always undefined — query_history.ts persists the field as
      // `dateRange` while RecentQueriesTable reads `timeRange`. Left threaded so the fix stays a
      // one-liner; fixing either side here would change legacy Discover, which shares that table.
      if (timeRange) {
        handleTimeChange({
          start: timeRange.from,
          end: timeRange.to,
          isInvalid: false,
          isQuickSelection: true,
        });
      }
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      dispatch(loadQueryActionCreator(services, setEditorTextWithQuery, updatedQuery));
      runPPLAnalyzeInBackground({
        query: { ...selectedQuery, query: updatedQuery },
        http: services.http,
        timefilter: services.data.query.timefilter.timefilter,
        onlyIfOpen: true,
      });
    },
    [closePopover, dispatch, handleTimeChange, services, setEditorTextWithQuery]
  );

  const handleClearSavedQuery = useCallback(() => {
    dispatch(setSavedQuery(undefined));
    closePopover();
  }, [closePopover, dispatch]);

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
      panelClassName={
        showRecentQueries
          ? 'exploreSaveQuery__popoverContent exploreSaveQuery__popoverContent--recentQueries'
          : 'exploreSaveQuery__popoverContent'
      }
    >
      {showRecentQueries ? (
        <>
          <EuiPopoverTitle paddingSize="s">
            <EuiButtonEmpty
              size="xs"
              flush="left"
              iconType="arrowLeft"
              data-test-subj="exploreSaveQueryRecentQueriesBackButton"
              onClick={() => setShowRecentQueries(false)}
            >
              {i18n.translate('explore.queryPanel.saveQueryButton.recentQueries', {
                defaultMessage: 'Recent queries',
              })}
            </EuiButtonEmpty>
          </EuiPopoverTitle>
          <RecentQueriesTable
            isVisible={true}
            queryString={services.data.query.queryString}
            onClickRecentQuery={handleRunRecentQuery}
          />
        </>
      ) : (
        <SavedQueryManagementComponent
          savedQueryService={savedQueryService}
          loadedSavedQuery={currentSavedQuery}
          onInitiateSave={() => {}}
          onInitiateSaveAsNew={() => {}}
          onLoad={handleLoadSavedQuery}
          onClearSavedQuery={handleClearSavedQuery}
          closeMenuPopover={closePopover}
          onRecentQueriesClick={() => setShowRecentQueries(true)}
          showSaveQuery={!!services.capabilities?.explore?.saveQuery}
          saveQuery={handleSaveQuery}
          useNewSavedQueryUI={true}
          saveQueryIsDisabled={saveButtonIsDisabled}
          textSize="xs"
        />
      )}
    </EuiPopover>
  );
};
