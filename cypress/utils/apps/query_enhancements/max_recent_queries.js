/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME, INDEX_WITH_TIME_1, QueryLanguages } from './constants';

export const MaxQueriesDataTypes = {
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
};

/**
 * Test confuguration for max recent queries
 * @returns {object[]}
 */
export const generateMaxQueriesTestConfiguration = () => {
  return Object.values(MaxQueriesDataTypes).flatMap((dataset) =>
    dataset.supportedLanguages.map((language) => {
      let datasetToUse;
      switch (dataset.name) {
        case MaxQueriesDataTypes.INDEX_PATTERN.name:
          datasetToUse = INDEX_PATTERN_WITH_TIME;
          break;
        case MaxQueriesDataTypes.INDEXES.name:
          datasetToUse = INDEX_WITH_TIME_1;
          break;
        default:
          throw new Error(`Unsupported dataset: ${dataset.name}`);
      }
      const baseQuery = {
        'OpenSearch SQL': `SELECT * FROM ${datasetToUse} WHERE `,
        PPL: `source = ${datasetToUse} | where `,
      };
      return {
        dataset: datasetToUse,
        datasetType: dataset.name,
        language: language.name,
        baseQuery: baseQuery[language.name],
        testQueries: [
          'bytes_transferred > 0',
          'bytes_transferred < 8000',
          'bytes_transferred > 8000',
          'status_code = 404',
          'status_code = 501',
          'status_code = 503',
          'status_code = 400',
          'status_code = 401',
          'status_code = 403',
          'status_code = 200',
          'event_sequence_number > 10000000',
        ],
        testName: `${language.name} and ${dataset.name}`,
      };
    })
  );
};
