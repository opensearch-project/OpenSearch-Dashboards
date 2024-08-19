/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { Dataset, DataStructure } from '../../../../common';
import { IndexPatternsContract } from '../../../index_patterns';

/**
 * TODO: SEAN - supportedLanguages, and more here.
 * Configuration for handling dataset operations.
 */
export interface DatasetHandlerConfig {
  /**
   * Converts a DataStructure to a Dataset which will be used for search and
   * analytics.
   *
   * @param {DataStructure} dataStructure - The DataStructure to convert.
   * @returns {Dataset} The resulting Dataset.
   */
  toDataset: (dataStructure: DataStructure) => Dataset;
  /**
   * TODO: SEAN - not sure if we need this, remove if not needed
   * Converts a Dataset to a DataStructure.
   *
   * @param {Dataset} dataset - The Dataset to convert.
   * @returns {DataStructure} The resulting DataStructure.
   */
  toDataStructure: (dataset: Dataset) => DataStructure;
  /**
   * Fetches child options for a given DataStructure.
   *
   * @param {DataStructure} dataStructure - The parent DataStructure.
   * @param {IndexPatternsContract} indexPatterns - The IndexPatternsContract for accessing index pattern information.
   * @returns {Promise<DataStructure[]>} A promise that resolves to an array of child DataStructures.
   */
  fetchOptions: (
    dataStructure: DataStructure,
    indexPatterns: IndexPatternsContract
  ) => Promise<DataStructure[]>;
  /**
   * Determines if a DataStructure is a leaf node (i.e., has no children).
   *
   * @param {DataStructure} dataStructure - The DataStructure to check.
   * @returns {boolean} True if the DataStructure is a leaf node, false otherwise.
   */
  isLeaf: (dataStructure: DataStructure) => boolean;
}
