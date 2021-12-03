/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IndexPatternField } from '../../../../../data/public';

interface ConfigSections {
  [id: string]: {
    title: string;
    fields: IndexPatternField[];
  };
}
interface ConfigState {
  configSections: ConfigSections;
}

// TODO: Temp. Remove once visualizations can be refgistered and editor configs can be passed along
// TODO: this is a placeholder while the config section is iorned out
const initialState: ConfigState = {
  configSections: {
    x: {
      title: 'X Axis',
      fields: [],
    },
    y: {
      title: 'Y Axis',
      fields: [],
    },
  },
};

interface SectionField {
  sectionId: string;
  field: IndexPatternField;
}

export const slice = createSlice({
  name: 'configuration',
  initialState,
  reducers: {
    addConfigSectionField: (state, action: PayloadAction<SectionField>) => {
      const { field, sectionId } = action.payload;
      if (state.configSections[sectionId]) {
        state.configSections[sectionId].fields.push(field);
      }
    },
    removeConfigSectionField: (state, action: PayloadAction<SectionField>) => {
      const { field, sectionId } = action.payload;
      if (state.configSections[sectionId]) {
        const fieldIndex = state.configSections[sectionId].fields.findIndex(
          (configField) => configField === field
        );
        if (fieldIndex !== -1) state.configSections[sectionId].fields.splice(fieldIndex, 1);
      }
    },
  },
});

export const { reducer } = slice;
export const { addConfigSectionField, removeConfigSectionField } = slice.actions;
