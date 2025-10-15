/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { setVisibleColumnNames } from '../../../slices';

export const removeVisibleColumnName = (columnId: string) => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const {
    query: { dataset },
    tab: {
      logs: { visibleColumnNames, defaultColumnNames },
    },
  } = getState();

  const newColumns = visibleColumnNames.filter((col) => col !== columnId);
  const newColumnsWithoutTime = newColumns.filter((col) => col !== dataset?.timeFieldName);

  if (!newColumnsWithoutTime.length) {
    dispatch(setVisibleColumnNames(defaultColumnNames));
  } else {
    dispatch(setVisibleColumnNames(newColumns));
  }
};
