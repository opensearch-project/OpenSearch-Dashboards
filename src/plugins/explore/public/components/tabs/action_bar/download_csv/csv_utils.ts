/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { unparse } from 'papaparse';
import moment from 'moment';
import { saveAs } from 'file-saver';
import { autoBom } from '@osd/std';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { IndexPattern } from '../../../../../../data/common';
import { VisTabular } from '../../../visualizations/utils/vis_data_to_tabular';

export const formatRowsForCsv =
  ({
    displayedColumnNames,
    indexPattern,
  }: {
    displayedColumnNames: string[];
    indexPattern: IndexPattern;
  }) =>
  (row: OpenSearchSearchHit) => {
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

/**
 * Builds the CSV text for rows the way the table shows them.
 */
export const buildCsv = ({
  rows,
  displayedColumnNames,
  indexPattern,
  uiSettings,
}: {
  rows: OpenSearchSearchHit[];
  displayedColumnNames: string[];
  indexPattern: IndexPattern;
  uiSettings: IUiSettingsClient;
}) => {
  const csvRowData = rows.map(formatRowsForCsv({ displayedColumnNames, indexPattern }));
  return unparse(
    { fields: displayedColumnNames, data: csvRowData },
    {
      quotes: uiSettings.get('csv:quoteValues', true),
      delimiter: uiSettings.get('csv:separator', ','),
      header: true,
    }
  );
};

/**
 * Builds the CSV text for a visualization's table (see visDataToTabular): its own columns and
 * formatted values, rather than the Logs table's columns.
 */
export const buildCsvFromTabular = (tabular: VisTabular, uiSettings: IUiSettingsClient) =>
  unparse(
    {
      fields: tabular.columns.map((col) => col.name),
      data: tabular.rows.map((row) =>
        tabular.columns.map((col) => row[col.field]?.formatted ?? '')
      ),
    },
    {
      quotes: uiSettings.get('csv:quoteValues', true),
      delimiter: uiSettings.get('csv:separator', ','),
      header: true,
    }
  );

export const saveDataAsCsv = (csvData: string) => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
  const fileName = `opensearch_export_${moment().format('YYYY-MM-DD')}`;
  saveAs(autoBom(blob), fileName);
};
