/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import Papa from 'papaparse';
// @ts-ignore
import { saveAs } from '@elastic/filesaver';
import moment from 'moment-timezone';
import { OpenSearchSearchHit } from '../../../doc_views/doc_views_types';
import { IndexPattern, UI_SETTINGS } from '../../../../../../data/common';
import { getServices } from '../../../../opensearch_dashboards_services';
import { useSelector } from '../../../utils/state_management';
import { buildColumns } from '../../../utils/columns';
import { DOC_HIDE_TIME_COLUMN_SETTING } from '../../../../../common';
import { getLegacyDisplayedColumns } from '../../default_discover_table/helper';

export interface DownloadCsvButtonProps {
  indexPattern: IndexPattern;
  rows: OpenSearchSearchHit[];
}

export const DownloadCsvButton = ({ indexPattern, rows }: DownloadCsvButtonProps) => {
  const { uiSettings } = getServices();

  const [isShortDots, hideTimeColumn] = useMemo(() => {
    return [
      uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
      uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING),
    ];
  }, [uiSettings]);

  const displayedColumnNames = useSelector((state) => {
    const stateColumns = state.discover.columns;
    // check if state columns is not undefined, otherwise use buildColumns
    const columns = buildColumns(stateColumns || []);

    // Handle the case where all fields/columns are removed except the time-field one
    const adjustedColumns =
      columns.length === 1 && columns[0] === indexPattern.timeFieldName
        ? [...columns, '_source']
        : columns;

    const displayedColumns = getLegacyDisplayedColumns(
      adjustedColumns,
      indexPattern,
      hideTimeColumn,
      isShortDots
    );
    return displayedColumns.map((column) => column.name);
  });

  const handleDownloadCsv = (): void => {
    const csvRowData = rows.map((row) => {
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
    });

    const csvData = Papa.unparse(
      {
        fields: displayedColumnNames,
        data: csvRowData,
      },
      {
        quotes: uiSettings.get('csv:quoteValues', true),
        delimiter: uiSettings.get('csv:separator', ','),
        header: true,
      }
    );
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    const fileName = `opensearch_export_${moment().format('YYYY-MM-DD')}`;
    saveAs(blob, fileName);
  };

  return (
    <EuiButtonEmpty size="s" iconType="download" iconSide="left" onClick={handleDownloadCsv}>
      <FormattedMessage
        id="discover.downloadCsv"
        values={{ count: rows.length }}
        defaultMessage="Download {count} {count, plural, one {document} other {documents}} as CSV"
      />
    </EuiButtonEmpty>
  );
};
