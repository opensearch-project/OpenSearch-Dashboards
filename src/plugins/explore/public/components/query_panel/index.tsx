/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryPanelLayout } from './layout';
import { EditorStack } from './components/editor_stack';

const QueryPanel = () => {
  return (
    <QueryPanelLayout
      footer={
        <div> {/* Add other controls like TimeRangeSelector, RecentQueriesToggle etc */}</div>
      }
    >
      <EditorStack />
    </QueryPanelLayout>
  );
};

export { QueryPanel };
