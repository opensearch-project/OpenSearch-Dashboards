/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { SOURCE_COLUMN_ID_AND_NAME } from '../../../../../../components/results_table/table_constants';
import { setVisibleColumnNames } from '../../../slices';

export const addVisibleColumnName = (columnId: string) => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const {
    tab: {
      logs: { visibleColumnNames },
    },
  } = getState();

  if (visibleColumnNames.includes(columnId)) {
    return;
  }

  // filter out _SOURCE since we are adding columns
  const newColumns = visibleColumnNames.filter((column) => column !== SOURCE_COLUMN_ID_AND_NAME);
  newColumns.push(columnId);
  dispatch(setVisibleColumnNames(newColumns));
};
