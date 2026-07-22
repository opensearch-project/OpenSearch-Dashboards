/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { cloneDeep } from 'lodash';
import { EuiPopover, EuiButtonEmpty, EuiIcon, EuiText } from '@elastic/eui';
import {
  SavedQueryManagementComponent,
  SavedQueryMeta,
  SavedQuery,
} from '../../../../../data/public';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { EditorMode } from '../../utils/state_management/types';
import '../../../components/query_panel/query_panel_widgets/save_query/save_query.scss';
import { QueryState } from '../query_builder/query_builder';

export const SaveQueryButton = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { queryBuilder, queryEditorState, queryState } = useQueryBuilderState();
  const { getEditorText, setEditorText } = useEditorOperations();

  const savedQueryService = services.data.query.savedQueries;
  const timeFilter = services.data.query.timefilter.timefilter;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currentSavedQueryId, setCurrentSavedQueryId] = useState<string | undefined>();
  const [currentSavedQuery, setCurrentSavedQuery] = useState<SavedQuery | undefined>();

  const saveButtonIsDisabled = queryEditorState.editorMode === EditorMode.Prompt;

  // Load saved query when ID changes
  useEffect(() => {
    if (currentSavedQueryId) {
      savedQueryService
        .getSavedQuery(currentSavedQueryId)
        .then(setCurrentSavedQuery)
        .catch(() => {
          setCurrentSavedQuery(undefined);
        });
    } else {
      setCurrentSavedQuery(undefined);
    }
  }, [currentSavedQueryId, savedQueryService]);

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const handleSaveQuery = async (meta: SavedQueryMeta, saveAsNew?: boolean) => {
    try {
      if (!queryState) return;

      const clonedQuery = cloneDeep(queryState);
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

      const savedQuery = await savedQueryService.saveQuery(attributes, {
        overwrite: !saveAsNew && !!currentSavedQueryId,
      });

      setCurrentSavedQueryId(savedQuery.id);

      services.notifications.toasts.addSuccess(`Your query "${attributes.title}" was saved`);

      setIsPopoverOpen(false);
    } catch (error) {
      services.notifications.toasts.addDanger(
        i18n.translate('explore.queryPanel.saveQuery.failedToSaveQuery', {
          defaultMessage: 'An error occurred while saving your query{errorMessage}',
          values: { errorMessage: (error as Error).message ? `: ${(error as Error).message}` : '' },
        })
      );
      throw error;
    }
  };

  const handleLoadSavedQuery = useCallback(
    async (savedQuery: SavedQuery) => {
      setCurrentSavedQueryId(savedQuery.id);
      queryBuilder.updateQueryState(savedQuery.attributes.query as QueryState);

      // Update editor text
      setEditorText(savedQuery.attributes.query.query as string);

      // Handle time filter if present
      if (savedQuery.attributes.timefilter && timeFilter) {
        queryBuilder.updateQueryEditorState({
          dateRange: {
            from: savedQuery.attributes.timefilter.from,
            to: savedQuery.attributes.timefilter.to,
          },
        });
        if (typeof timeFilter.setRefreshInterval === 'function') {
          timeFilter.setRefreshInterval(savedQuery.attributes.timefilter.refreshInterval);
        }
      }

      setIsPopoverOpen(false);
    },
    [queryBuilder, setEditorText, timeFilter]
  );

  const handleClearSavedQuery = useCallback(() => {
    setCurrentSavedQueryId(undefined);
    setIsPopoverOpen(false);
  }, []);

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
