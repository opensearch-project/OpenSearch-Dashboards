/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../../../../types';
import { AppDispatch, RootState } from '../../../store';
import { Dataset, DEFAULT_DATA } from '../../../../../../../../data/common';
import { setVisibleColumnNames } from '../../../slices';
import { addSourceOrTimeToFields } from '../../../utils/add_source_or_time_to_fields';

export const reconcileVisibleColumnsWithDataset = (
  services: ExploreServices,
  dataset?: Dataset
) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const { dataViews } = services;
  const {
    tab: {
      logs: { visibleColumnNames, defaultColumnNames },
    },
  } = getState();

  if (!dataset || !visibleColumnNames.length) {
    dispatch(setVisibleColumnNames(defaultColumnNames));
    return;
  }

  const dataView = await dataViews.get(
    dataset.id,
    dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
  );

  const fieldsNameFromDataset = dataView.fields.getAll().map((field) => field.name);

  // filter out any columns from previous visibleColumns that is not in the dataset and remove duplicates
  const filteredColumnNames = [
    ...new Set(visibleColumnNames.filter((column) => fieldsNameFromDataset.includes(column))),
  ];

  const correctedFilteredColumns = addSourceOrTimeToFields(filteredColumnNames, dataset);
  dispatch(setVisibleColumnNames(correctedFilteredColumns));
};
