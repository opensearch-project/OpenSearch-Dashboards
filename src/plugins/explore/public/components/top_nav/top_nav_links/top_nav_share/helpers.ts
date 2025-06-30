/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchSource } from '../../../../../../data/common';
import { LegacyState } from '../../../../application/utils/state_management/slices';
import { ExploreServices } from '../../../../types';
import {
  DOC_HIDE_TIME_COLUMN_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
} from '../../../../../common/legacy/discover';
import { getSortForSearchSource } from '../../../../application/legacy/discover/application/view_components/utils/get_sort_for_search_source';

/**
 * TODO: Fix up this file and add unit tests
 */

// TODO: This does not seem to affect the share menu. need to look into it in future
// const getFieldCounts = async () => {
//   // the field counts aren't set until we have the data back,
//   // so we wait for the fetch to be done before proceeding
//   if ($scope.fetchStatus === fetchStatuses.COMPLETE) {
//     return $scope.fieldCounts;
//   }

//   return await new Promise((resolve) => {
//     const unwatch = $scope.$watch('fetchStatus', (newValue) => {
//       if (newValue === fetchStatuses.COMPLETE) {
//         unwatch();
//         resolve($scope.fieldCounts);
//       }
//     });
//   });
// };

export const getSharingDataFields = async (
  selectedFields: string[],
  hideTimeColumn: boolean,
  timeFieldName?: string
) => {
  if (selectedFields.length === 1 && selectedFields[0] === '_source') {
    // const fieldCounts = await getFieldCounts();
    return {
      searchFields: undefined,
      // selectFields: keys(fieldCounts).sort(),
    };
  }

  const fields =
    timeFieldName && !hideTimeColumn ? [timeFieldName, ...selectedFields] : selectedFields;
  return {
    searchFields: fields,
    selectFields: fields,
  };
};

export const getSharingData = async ({
  searchSource,
  state,
  services,
}: {
  searchSource: ISearchSource;
  state: LegacyState;
  services: ExploreServices;
}) => {
  const searchSourceInstance = searchSource.createCopy();
  const indexPattern = await searchSourceInstance.getField('index');

  const { searchFields } = await getSharingDataFields(
    state.columns,
    services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING, false),
    indexPattern?.timeFieldName
  );

  searchSourceInstance.setField('fields', searchFields);
  searchSourceInstance.setField(
    'sort',
    getSortForSearchSource(
      state.sort,
      indexPattern,
      services.uiSettings.get(SORT_DEFAULT_ORDER_SETTING, 'desc')
    )
  );
  searchSourceInstance.setField('highlight', null);
  searchSourceInstance.setField('highlightAll', undefined);
  searchSourceInstance.setField('aggs', null);
  searchSourceInstance.setField('size', undefined);

  const body = await searchSource.getSearchRequestBody();
  return {
    searchRequest: {
      index: indexPattern?.title,
      body,
    },
    // fields: selectFields,
    metaFields: indexPattern?.metaFields,
    conflictedTypesFields: indexPattern?.fields
      .filter((f) => f.type === 'conflict')
      .map((f) => f.name),
    indexPatternId: indexPattern?.id,
  };
};
