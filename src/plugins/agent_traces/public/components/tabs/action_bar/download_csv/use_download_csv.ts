/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { unparse } from 'papaparse';
import moment from 'moment';
import { saveAs } from 'file-saver';
import { DownloadCsvFormId, MAX_DOWNLOAD_CSV_COUNT } from './constants';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { useDispatch } from '../../../../application/legacy/discover/application/utils/state_management';
import { exportMaxSizeCsv } from '../../../../application/utils/state_management/actions/export_actions';
import { IndexPattern } from '../../../../../../data/common';
import { getServices } from '../../../../application/legacy/discover/opensearch_dashboards_services';
import { useDisplayedColumnNames } from '../../../../helpers/use_displayed_columns';

export interface UseDiscoverDownloadCsvProps {
  hits?: number;
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
  onLoading(): void;
  onSuccess(): void;
  onError(): void;
}

export const formatRowsForCsv = ({
  displayedColumnNames,
  indexPattern,
}: {
  displayedColumnNames: string[];
  indexPattern: IndexPattern;
}) => (row: OpenSearchSearchHit) => {
  return displayedColumnNames.map((colName) => {
    const fieldInfo = indexPattern.fields.getByName(colName);

    if (typeof row === 'undefined') {
      return '';
    }

    if (fieldInfo?.type === '_source') {
      const formattedRow = indexPattern.formatHit(row, 'text');
      return JSON.stringify(formattedRow);
    }

    const formattedValue = indexPattern.formatField(row, colName, 'text');

    if (typeof formattedValue === 'undefined') {
      return '';
    }

    return formattedValue;
  });
};

export const saveDataAsCsv = (csvData: string) => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
  const fileName = `opensearch_export_${moment().format('YYYY-MM-DD')}`;
  saveAs(blob, fileName);
};

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
      const csvRowData = rowsToDownload.map(
        formatRowsForCsv({ displayedColumnNames, indexPattern })
      );
      const csvData = unparse(
        { fields: displayedColumnNames, data: csvRowData },
        {
          quotes: uiSettings.get('csv:quoteValues', true),
          delimiter: uiSettings.get('csv:separator', ','),
          header: true,
        }
      );
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
