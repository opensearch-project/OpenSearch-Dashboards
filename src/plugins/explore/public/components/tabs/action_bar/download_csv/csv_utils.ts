/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { unparse } from 'papaparse';
import moment from 'moment';
import { saveAs } from 'file-saver';
import { autoBom } from '@osd/std';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { pick } from 'lodash';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { IndexPattern } from '../../../../../../data/common';
import { VisTabular } from '../../../visualizations/utils/vis_data_to_tabular';
import { isSourceColumn } from '../../../../helpers/is_source_column';
import { getSourceFieldNames } from '../../../../helpers/source_field_names';

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

      if (isSourceColumn(colName, fieldInfo)) {
        // The same fields the table's _source cell shows, without meta fields such as _id.
        const formattedRow = indexPattern.formatHit(row, 'text');
        const shownFields = getSourceFieldNames(
          indexPattern.flattenHit(row),
          indexPattern.metaFields
        );
        return JSON.stringify(pick(formattedRow, shownFields));
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
