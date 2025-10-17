/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../../../types';
import { Dataset, DEFAULT_DATA } from '../../../../../../../data/common';
import { getCurrentAppId, getFlavorFromAppId } from '../../../../../helpers/get_flavor_from_app_id';
import {
  DEFAULT_COLUMNS_SETTING,
  DEFAULT_TRACE_COLUMNS_SETTING,
  ExploreFlavor,
} from '../../../../../../common';
import { addSourceOrTimeToFields, defaultColumnNames } from '../add_source_or_time_to_fields';

/**
 * Grabs the columns that should be displayed for the given dataset as default
 */
export const getDefaultColumnNames = async (
  services: ExploreServices,
  dataset?: Dataset
): Promise<string[]> => {
  if (!dataset) {
    return defaultColumnNames;
  }

  const { dataViews, uiSettings } = services;
  const dataView = await dataViews.get(
    dataset.id,
    dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
  );
  const currentAppId = await getCurrentAppId(services);
  const flavorFromAppId = getFlavorFromAppId(currentAppId);

  const columnNames: string[] =
    flavorFromAppId === ExploreFlavor.Traces
      ? uiSettings?.get(DEFAULT_TRACE_COLUMNS_SETTING) ?? []
      : uiSettings?.get(DEFAULT_COLUMNS_SETTING) ?? [];
  const fieldsNameFromDataset = dataView.fields.getAll().map((field) => field.name);

  // filter out any columns from default setting that is not in the dataset and remove duplicates
  const filteredColumnNames = [
    ...new Set(columnNames.filter((column) => fieldsNameFromDataset.includes(column))),
  ];

  return addSourceOrTimeToFields(filteredColumnNames, dataset);
};
