/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSetOption, IndexPattern, IndexPatternsContract } from '../../../../data/public';
import { SearchData } from '../view_components/utils/use_search';

function getDataSet(
  dataSet: IndexPattern | DataSetOption | undefined,
  state: SearchData,
  indexPatternsService: IndexPatternsContract
) {
  if (!dataSet) {
    return;
  }
  if (dataSet instanceof IndexPattern) {
    return (
      (state.title &&
        state.title !== dataSet?.title &&
        indexPatternsService.getByTitle(state.title!, true)) ||
      dataSet
    );
  }
  return dataSet;
}

export { getDataSet };
