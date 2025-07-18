/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FilterPanelToggle } from './filter_panel_toggle';
import { rootReducer, RootState } from '../../../../application/utils/state_management/store';

export default {
  title: 'src/plugins/explore/public/components/query_panel/footer/filter_panel_toggle',
  component: FilterPanelToggle,
} as ComponentMeta<typeof FilterPanelToggle>;

const Template: ComponentStory<typeof FilterPanelToggle> = () => (
  <Provider
    store={configureStore({
      reducer: rootReducer,
      preloadedState: {
        ui: {
          showFilterPanel: true,
        },
      } as RootState,
    })}
  >
    <FilterPanelToggle />
  </Provider>
);

export const FieldsHidden = Template.bind({});
FieldsHidden.args = {};
