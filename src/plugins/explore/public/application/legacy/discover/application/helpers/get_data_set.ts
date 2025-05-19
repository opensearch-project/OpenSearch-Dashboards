/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern, IndexPatternsContract } from '../../../../data/public';
import { SearchData } from '../view_components/utils/use_search';

function getDataSet(
  indexPattern: IndexPattern | undefined,
  state: SearchData,
  indexPatternsService: IndexPatternsContract
) {
  if (!indexPattern) {
    return;
  }
  return (
    (state.title &&
      state.title !== indexPattern?.title &&
      indexPatternsService.getByTitle(state.title!, true)) ||
    indexPattern
  );
}

export { getDataSet };
