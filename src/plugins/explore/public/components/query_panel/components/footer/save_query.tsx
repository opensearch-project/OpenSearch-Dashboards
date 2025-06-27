/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { cloneDeep } from 'lodash';
import { EuiPopover, EuiButtonEmpty, EuiIcon } from '@elastic/eui';
import {
  SavedQueryManagementComponent,
  SaveQueryForm,
  SavedQueryMeta,
  SavedQuery,
  useSavedQuery,
  TimefilterContract,
} from '../../../../../../data/public';
import { selectSavedQuery } from '../../../../application/utils/state_management/selectors';

import { ExploreServices } from '../../../../types';
import { Query } from '../../types';

export const SaveQueryButton: React.FC<{
  services: ExploreServices;
  showDatePicker: boolean;
  timeFilter: TimefilterContract;
  query: Query;
  onClearQuery: () => void;
  onSavedQuery: (newSavedQueryId: string | undefined) => void;
  onLoadSavedQuery: (savedQuery: SavedQuery) => void;
}> = ({
  services,
  showDatePicker,
  timeFilter,
  query,
  onClearQuery,
  onSavedQuery,
  onLoadSavedQuery,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const savedQueryId = useSelector(selectSavedQuery);

  const savedQueryService = services.data.query.savedQueries;

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const [isSaveQueryFormOpen, setIsSaveQueryFormOpen] = React.useState(false);
  const [saveAsNew, setSaveAsNew] = React.useState(false);

  const { savedQuery: loadedSavedQuery, setSavedQuery, clearSavedQuery } = useSavedQuery({
    queryService: services.data.query,
    savedQueryId,
    notifications: services.notifications,
  });

  // Handlers for Saved Query UI
  const handleInitiateSave = () => {
    setSaveAsNew(false);
    setIsSaveQueryFormOpen(true);
  };
  const handleInitiateSaveAsNew = () => {
    setSaveAsNew(true);
    setIsSaveQueryFormOpen(true);
  };

  const handleLoadSavedQuery = useCallback(
    (savedQuery) => {
      setSavedQuery(savedQuery);
      if (savedQuery?.attributes?.query) {
        onLoadSavedQuery(savedQuery);
      }
      if (savedQuery?.attributes?.timefilter && timeFilter) {
        timeFilter.setTime({
          from: savedQuery.attributes.timefilter.from,
          to: savedQuery.attributes.timefilter.to,
        });
        if (typeof timeFilter.setRefreshInterval === 'function') {
          timeFilter.setRefreshInterval(savedQuery.attributes.timefilter.refreshInterval);
        }
      }
    },
    [onLoadSavedQuery, setSavedQuery, timeFilter]
  );

  const handleClearSavedQuery = useCallback(() => {
    clearSavedQuery();
    onClearQuery();
    if (timeFilter) {
      timeFilter.setTime({ from: 'now-15m', to: 'now' });
      if (typeof timeFilter.setRefreshInterval === 'function') {
        timeFilter.setRefreshInterval({ value: 0, pause: true });
      }
    }
  }, [clearSavedQuery, onClearQuery, timeFilter]);

  const handleSaveQuery = async (meta: SavedQueryMeta, saveAsNewParam?: boolean) => {
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

      // Overwrite if editing, not if saving as new
      const overwrite = !(saveAsNewParam ?? saveAsNew);
      const savedQuery = await savedQueryService.saveQuery(attributes, { overwrite });
      services.notifications.toasts.addSuccess(
        `Your query "${savedQuery.attributes.title}" was saved`
      );

      setIsSaveQueryFormOpen(false);
      setSavedQuery(savedQuery);
      onSavedQuery(savedQuery.id);
    } catch (error) {
      services.notifications.toasts.addDanger(
        i18n.translate('data.search_bar.save_query.failedToSaveQuery', {
          defaultMessage: 'An error occured while saving your query{errorMessage}',
          values: { errorMessage: error.message ? `: ${error.message}` : '' },
        })
      );
      throw error;
    }
  };

  /*
   * This Function is here to show the toggle in saved query form
   * in case you the date range (from/to)
   */
  const shouldRenderTimeFilterInSavedQueryForm = () => {
    return showDatePicker || (!showDatePicker && timeFilter.getTime() !== undefined);
  };

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
              defaultMessage: 'Saved Queries',
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
          loadedSavedQuery={loadedSavedQuery}
          onInitiateSave={handleInitiateSave}
          onInitiateSaveAsNew={handleInitiateSaveAsNew}
          onLoad={handleLoadSavedQuery}
          onClearSavedQuery={handleClearSavedQuery}
          closeMenuPopover={() => {}}
          showSaveQuery={true}
          saveQuery={handleSaveQuery}
          useNewSavedQueryUI={false}
        />
      </EuiPopover>
      {isSaveQueryFormOpen && (
        <SaveQueryForm
          formUiType="Modal"
          savedQuery={saveAsNew ? undefined : loadedSavedQuery?.attributes}
          savedQueryService={savedQueryService}
          onSave={handleSaveQuery}
          onClose={() => setIsSaveQueryFormOpen(false)}
          saveAsNew={saveAsNew}
          setSaveAsNew={setSaveAsNew}
          showFilterOption={false}
          showTimeFilterOption={shouldRenderTimeFilterInSavedQueryForm()}
        />
      )}
    </>
  );
};
