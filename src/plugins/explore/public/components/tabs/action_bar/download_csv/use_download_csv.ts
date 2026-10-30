/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { DownloadCsvFormId, MAX_DOWNLOAD_CSV_COUNT } from './constants';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import {
  useDispatch,
  useSelector,
} from '../../../../application/legacy/discover/application/utils/state_management';
import { selectActiveTabId } from '../../../../application/utils/state_management/selectors';
import { EXPLORE_VISUALIZATION_TAB_ID } from '../../../../../common';
import { getVisualizationBuilder } from '../../../visualizations/visualization_builder';
import { visDataToTabular } from '../../../visualizations/utils/vis_data_to_tabular';
import { exportMaxSizeCsv } from '../../../../application/utils/state_management/actions/export_actions';
import { IndexPattern } from '../../../../../../data/common';
import { getServices } from '../../../../application/legacy/discover/opensearch_dashboards_services';
import { useDisplayedColumnNames } from '../../../../helpers/use_displayed_columns';
import { buildCsv, buildCsvFromTabular, saveDataAsCsv } from './csv_utils';

export interface UseDiscoverDownloadCsvProps {
  hits?: number;
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
  onLoading(): void;
  onSuccess(): void;
  onError(): void;
}

export const useDiscoverDownloadCsv = ({
  hits,
  rows,
  indexPattern,
  onLoading,
  onSuccess,
  onError,
}: UseDiscoverDownloadCsvProps) => {
  const dispatch = useDispatch();
  const services = getServices();
  const { uiSettings } = services;
  const [isLoading, setIsLoading] = useState(false);
  // Use shared hook to ensure CSV export columns match DataTable display columns
  const displayedColumnNames = useDisplayedColumnNames({ includeFieldCounts: true });
  const activeTabId = useSelector(selectActiveTabId);

  const downloadCsvForOption = async (option: DownloadCsvFormId) => {
    try {
      const rowsToDownload = rows;
      if (option === DownloadCsvFormId.Max) {
        setIsLoading(true);
        onLoading();
        if (!hits) throw new Error('No hits');
        const size = Math.min(hits || 0, MAX_DOWNLOAD_CSV_COUNT);
        // Replace fetchForMaxCsvOption with Redux action
        await dispatch(
          exportMaxSizeCsv({
            maxSize: size,
            services,
          }) as any
        );
        // The Redux action handles the download, so we don't need to process rows here
        onSuccess();
        return;
      }

      // The Visualization tab exports the table that exactly matches visualization
      const visData =
        activeTabId === EXPLORE_VISUALIZATION_TAB_ID
          ? getVisualizationBuilder().data$.getValue()
          : undefined;
      const csvData = visData
        ? buildCsvFromTabular(visDataToTabular(visData, indexPattern), uiSettings)
        : buildCsv({
            rows: rowsToDownload,
            displayedColumnNames,
            indexPattern,
            uiSettings,
          });
      saveDataAsCsv(csvData);
      onSuccess();
    } catch (err) {
      // Abort is handled by use_download_csv_toasts
      if (err.name !== 'AbortError') {
        onError();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    downloadCsvForOption,
    isLoading,
  };
};
