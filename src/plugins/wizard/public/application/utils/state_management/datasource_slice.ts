/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IndexPattern } from 'src/plugins/data/common';

import { IndexPatternField, OSD_FIELD_TYPES } from '../../../../../data/public';

const ALLOWED_FIELDS: string[] = [OSD_FIELD_TYPES.STRING, OSD_FIELD_TYPES.NUMBER];

interface DataSourceState {
  indexPattern: IndexPattern | null;
  visualizableFields: IndexPatternField[];
}

const initialState: DataSourceState = {
  indexPattern: null,
  visualizableFields: [],
};

export const slice = createSlice({
  name: 'dataSource',
  initialState,
  reducers: {
    setIndexPattern: (state, action: PayloadAction<IndexPattern>) => {
      state.indexPattern = action.payload;
      state.visualizableFields = action.payload.fields.filter(isVisualizable);
    },
  },
});

export const { reducer } = slice;
export const { setIndexPattern } = slice.actions;

// TODO: Temporary validate function
// Need to identify hopw to get fieldCounts to use the standard filter and group functions
function isVisualizable(field: IndexPatternField): boolean {
  const isAggregatable = field.aggregatable === true;
  const isNotScripted = !field.scripted;
  const isAllowed = ALLOWED_FIELDS.includes(field.type);

  return isAggregatable && isNotScripted && isAllowed;
}
