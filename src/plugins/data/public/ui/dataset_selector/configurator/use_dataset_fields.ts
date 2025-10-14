/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BaseDataset, DatasetField } from '../../../../common';
import { DatasetTypeConfig } from '../../../query/query_string/dataset_service';

export interface UseDatasetFieldsResult {
  allFields: DatasetField[];
  dateFields: DatasetField[];
  loading: boolean;
}

export const useDatasetFields = (
  baseDataset: BaseDataset,
  datasetType: DatasetTypeConfig | undefined,
  supportsTimeFilter: boolean
): UseDatasetFieldsResult => {
  const [allFields, setAllFields] = useState<DatasetField[]>([]);
  const [dateFields, setDateFields] = useState<DatasetField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Early return if time filter is not supported
    if (!supportsTimeFilter) {
      setDateFields([]);
      setAllFields([]);
      return;
    }

    const fetchFields = async () => {
      if (!datasetType) {
        setDateFields([]);
        setAllFields([]);
        return;
      }

      setLoading(true);
      try {
        const fields = await datasetType.fetchFields(baseDataset);
        const filteredDateFields = fields?.filter((field) => field.type === 'date') || [];
        setDateFields(filteredDateFields);
        setAllFields(fields || []);
      } catch (error) {
        // Handle error silently, reset fields
        setDateFields([]);
        setAllFields([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [baseDataset, datasetType, supportsTimeFilter]);

  return { allFields, dateFields, loading };
};
