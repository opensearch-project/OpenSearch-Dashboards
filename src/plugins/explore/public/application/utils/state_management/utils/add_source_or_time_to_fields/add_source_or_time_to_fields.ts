/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../../../../data/common';
import { SOURCE_COLUMN_ID_AND_NAME } from '../../../../../components/results_table/table_constants';

export const defaultColumnNames = [SOURCE_COLUMN_ID_AND_NAME];

export const addSourceOrTimeToFields = (columns: string[], dataset: Dataset): string[] => {
  let output: string[] = [...columns];
  const columnsWithoutTime = columns.filter((column) => column !== dataset.timeFieldName);

  // handle _source:
  //  if empty, then should be default
  //  if there are more than 1 column, _source shouldn't exist
  if (!columnsWithoutTime.length) {
    output = dataset.timeFieldName
      ? [dataset.timeFieldName, ...defaultColumnNames]
      : [...defaultColumnNames];
  } else if (
    columnsWithoutTime.length > 1 &&
    columnsWithoutTime.includes(SOURCE_COLUMN_ID_AND_NAME)
  ) {
    output = columns.filter((col) => col !== SOURCE_COLUMN_ID_AND_NAME);
  }

  // handle time field
  const timeFieldName = dataset.timeFieldName;
  if (!timeFieldName || output.includes(timeFieldName)) {
    return output;
  }
  return [timeFieldName, ...output];
};
