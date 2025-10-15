/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useProcessedResults } from '../../use_processed_results';
import { useDatasetContext } from '../../../../../application/context';
import { getIndexPatternFieldList } from '../../../../fields_selector/lib/get_index_pattern_field_list';
import { DataViewField } from '../../../../../../../data/common';

export const useFieldsList = () => {
  const processedResults = useProcessedResults();
  const { dataset } = useDatasetContext();

  return useMemo(
    () => getIndexPatternFieldList(dataset, processedResults?.fieldCounts) as DataViewField[],
    [processedResults?.fieldCounts, dataset]
  );
};
