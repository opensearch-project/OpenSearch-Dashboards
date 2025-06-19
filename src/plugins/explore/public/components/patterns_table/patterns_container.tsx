/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { selectRows, selectTotalHits } from '../../application/utils/state_management/selectors';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD } from './utils/constants';

export const PatternsContainer = () => {
  const rows = useSelector(selectRows); // TODO: use rows from patterns-appended query
  const totalHits = useSelector(selectTotalHits);

  // Convert rows to pattern items or use default if rows is undefined
  const items: PatternItem[] = rows?.map((row) => ({
    pattern: row._source[PATTERNS_FIELD],
    ratio: row._source[COUNT_FIELD] / 2096, // TODO: pull from total hits
    count: row._source[COUNT_FIELD],
  }));

  return <PatternsTable items={items} />;
};
