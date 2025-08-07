/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { ExploreDataTable } from '../data_table/explore_data_table';
import { ActionBar } from './action_bar/action_bar';

export const SpansTab = () => {
  return (
    <div className="explore-spans-tab tab-container">
      <ActionBar />
      <ExploreDataTable />
    </div>
  );
};
